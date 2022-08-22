'use strict'
exports.__esModule = true
// Const
var TRANSFORMED_TYPE_KEY = '@t'
var CIRCULAR_REF_KEY = '@r'
var KEY_REQUIRE_ESCAPING_RE = /^#*@(t|r)$/
var GLOBAL = (function getGlobal() {
  // // NOTE: see http://www.ecma-international.org/ecma-262/6.0/index.html#sec-performeval step 10
  // const savedEval = eval
  // return savedEval('this')
  // Removes requirement of the 'unsafe-eval'
  return window
})()
var ARRAY_BUFFER_SUPPORTED = typeof ArrayBuffer === 'function'
var MAP_SUPPORTED = typeof Map === 'function'
var SET_SUPPORTED = typeof Set === 'function'
var TYPED_ARRAY_CTORS = [
  'Int8Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array',
]
// Saved proto functions
var arrSlice = Array.prototype.slice
// Default serializer
var JSONSerializer = {
  serialize: function (val) {
    return JSON.stringify(val)
  },
  deserialize: function (val) {
    return JSON.parse(val)
  },
}
// EncodingTransformer
var EncodingTransformer = /** @class */ (function () {
  function EncodingTransformer(val, transforms) {
    this.references = val
    this.transforms = transforms
    this.transformsMap = this._makeTransformsMap()
    this.circularCandidates = []
    this.circularCandidatesDescrs = []
    this.circularRefCount = 0
  }
  EncodingTransformer._createRefMark = function (idx) {
    var obj = Object.create(null)
    obj[CIRCULAR_REF_KEY] = idx
    return obj
  }
  EncodingTransformer.prototype._createCircularCandidate = function (
    val,
    parent,
    key
  ) {
    this.circularCandidates.push(val)
    this.circularCandidatesDescrs.push({ parent: parent, key: key, refIdx: -1 })
  }
  EncodingTransformer.prototype._applyTransform = function (
    val,
    parent,
    key,
    transform
  ) {
    var result = Object.create(null)
    var serializableVal = transform.toSerializable(val)
    if (typeof serializableVal === 'object')
      this._createCircularCandidate(val, parent, key)
    result[TRANSFORMED_TYPE_KEY] = transform.type
    result.data = this._handleValue(
      function () {
        return serializableVal
      },
      parent,
      key
    )
    return result
  }
  EncodingTransformer.prototype._handleArray = function (arr) {
    var result = []
    var _loop_1 = function (i) {
      result[i] = this_1._handleValue(
        function () {
          return arr[i]
        },
        result,
        i
      )
    }
    var this_1 = this
    for (var i = 0; i < arr.length; i++) {
      _loop_1(i)
    }
    return result
  }
  EncodingTransformer.prototype._handlePlainObject = function (obj) {
    var _a, _b
    var result = Object.create(null)
    var _loop_2 = function (key) {
      if (Reflect.has(obj, key)) {
        var resultKey = KEY_REQUIRE_ESCAPING_RE.test(key) ? '#' + key : key
        result[resultKey] = this_2._handleValue(
          function () {
            return obj[key]
          },
          result,
          resultKey
        )
      }
    }
    var this_2 = this
    for (var key in obj) {
      _loop_2(key)
    }
    var name =
      (_b =
        (_a = obj === null || obj === void 0 ? void 0 : obj.__proto__) ===
          null || _a === void 0
          ? void 0
          : _a.constructor) === null || _b === void 0
        ? void 0
        : _b.name
    if (name && name !== 'Object') {
      result.constructor = { name: name }
    }
    return result
  }
  EncodingTransformer.prototype._handleObject = function (obj, parent, key) {
    this._createCircularCandidate(obj, parent, key)
    return Array.isArray(obj)
      ? this._handleArray(obj)
      : this._handlePlainObject(obj)
  }
  EncodingTransformer.prototype._ensureCircularReference = function (obj) {
    var circularCandidateIdx = this.circularCandidates.indexOf(obj)
    if (circularCandidateIdx > -1) {
      var descr = this.circularCandidatesDescrs[circularCandidateIdx]
      if (descr.refIdx === -1)
        descr.refIdx = descr.parent ? ++this.circularRefCount : 0
      return EncodingTransformer._createRefMark(descr.refIdx)
    }
    return null
  }
  EncodingTransformer.prototype._handleValue = function (getVal, parent, key) {
    try {
      var val = getVal()
      var type = typeof val
      var isObject = type === 'object' && val !== null
      if (isObject) {
        var refMark = this._ensureCircularReference(val)
        if (refMark) return refMark
      }
      var transform = this._findTransform(type, val)
      if (transform) {
        return this._applyTransform(val, parent, key, transform)
      }
      if (isObject) return this._handleObject(val, parent, key)
      return val
    } catch (e) {
      try {
        return this._handleValue(
          function () {
            return e instanceof Error ? e : new Error(e)
          },
          parent,
          key
        )
      } catch (_a) {
        return null
      }
    }
  }
  EncodingTransformer.prototype._makeTransformsMap = function () {
    if (!MAP_SUPPORTED) {
      return
    }
    var map = new Map()
    this.transforms.forEach(function (transform) {
      if (transform.lookup) {
        map.set(transform.lookup, transform)
      }
    })
    return map
  }
  EncodingTransformer.prototype._findTransform = function (type, val) {
    if (MAP_SUPPORTED) {
      if (val && val.constructor) {
        var transform = this.transformsMap.get(val.constructor)
        if (
          transform === null || transform === void 0
            ? void 0
            : transform.shouldTransform(type, val)
        )
          return transform
      }
    }
    for (var _i = 0, _a = this.transforms; _i < _a.length; _i++) {
      var transform = _a[_i]
      if (transform.shouldTransform(type, val)) return transform
    }
  }
  EncodingTransformer.prototype.transform = function () {
    var _this = this
    var references = [
      this._handleValue(
        function () {
          return _this.references
        },
        null,
        null
      ),
    ]
    for (var _i = 0, _a = this.circularCandidatesDescrs; _i < _a.length; _i++) {
      var descr = _a[_i]
      if (descr.refIdx > 0) {
        references[descr.refIdx] = descr.parent[descr.key]
        descr.parent[descr.key] = EncodingTransformer._createRefMark(
          descr.refIdx
        )
      }
    }
    return references
  }
  return EncodingTransformer
})()
// DecodingTransform
var DecodingTransformer = /** @class */ (function () {
  function DecodingTransformer(references, transformsMap) {
    this.activeTransformsStack = []
    this.visitedRefs = Object.create(null)
    this.references = references
    this.transformMap = transformsMap
  }
  DecodingTransformer.prototype._handlePlainObject = function (obj) {
    var unescaped = Object.create(null)
    if ('constructor' in obj) {
      if (!obj.constructor || typeof obj.constructor.name !== 'string') {
        obj.constructor = {
          name: 'Object',
        }
      }
    }
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        this._handleValue(obj[key], obj, key)
        if (KEY_REQUIRE_ESCAPING_RE.test(key)) {
          // NOTE: use intermediate object to avoid unescaped and escaped keys interference
          // E.g. unescaped "##@t" will be "#@t" which can overwrite escaped "#@t".
          unescaped[key.substring(1)] = obj[key]
          delete obj[key]
        }
      }
    }
    for (var unsecapedKey in unescaped)
      obj[unsecapedKey] = unescaped[unsecapedKey]
  }
  DecodingTransformer.prototype._handleTransformedObject = function (
    obj,
    parent,
    key
  ) {
    var transformType = obj[TRANSFORMED_TYPE_KEY]
    var transform = this.transformMap[transformType]
    if (!transform)
      throw new Error('Can\'t find transform for "' + transformType + '" type.')
    this.activeTransformsStack.push(obj)
    this._handleValue(obj.data, obj, 'data')
    this.activeTransformsStack.pop()
    parent[key] = transform.fromSerializable(obj.data)
  }
  DecodingTransformer.prototype._handleCircularSelfRefDuringTransform = function (
    refIdx,
    parent,
    key
  ) {
    // NOTE: we've hit a hard case: object reference itself during transformation.
    // We can't dereference it since we don't have resulting object yet. And we'll
    // not be able to restore reference lately because we will need to traverse
    // transformed object again and reference might be unreachable or new object contain
    // new circular references. As a workaround we create getter, so once transformation
    // complete, dereferenced property will point to correct transformed object.
    var references = this.references
    Object.defineProperty(parent, key, {
      // @ts-ignore
      val: void 0,
      configurable: true,
      enumerable: true,
      get: function () {
        if (this.val === void 0) this.val = references[refIdx]
        return this.val
      },
      set: function (value) {
        this.val = value
      },
    })
  }
  DecodingTransformer.prototype._handleCircularRef = function (
    refIdx,
    parent,
    key
  ) {
    if (this.activeTransformsStack.includes(this.references[refIdx]))
      this._handleCircularSelfRefDuringTransform(refIdx, parent, key)
    else {
      if (!this.visitedRefs[refIdx]) {
        this.visitedRefs[refIdx] = true
        this._handleValue(this.references[refIdx], this.references, refIdx)
      }
      parent[key] = this.references[refIdx]
    }
  }
  DecodingTransformer.prototype._handleValue = function (val, parent, key) {
    if (typeof val !== 'object' || val === null) return
    var refIdx = val[CIRCULAR_REF_KEY]
    if (refIdx !== void 0) this._handleCircularRef(refIdx, parent, key)
    else if (val[TRANSFORMED_TYPE_KEY])
      this._handleTransformedObject(val, parent, key)
    else if (Array.isArray(val)) {
      for (var i = 0; i < val.length; i++) this._handleValue(val[i], val, i)
    } else this._handlePlainObject(val)
  }
  DecodingTransformer.prototype.transform = function () {
    this.visitedRefs[0] = true
    this._handleValue(this.references[0], this.references, 0)
    return this.references[0]
  }
  return DecodingTransformer
})()
// Transforms
var builtInTransforms = [
  {
    type: '[[NaN]]',
    shouldTransform: function (type, val) {
      return type === 'number' && isNaN(val)
    },
    toSerializable: function () {
      return ''
    },
    fromSerializable: function () {
      return NaN
    },
  },
  {
    type: '[[undefined]]',
    shouldTransform: function (type) {
      return type === 'undefined'
    },
    toSerializable: function () {
      return ''
    },
    fromSerializable: function () {
      return void 0
    },
  },
  {
    type: '[[Date]]',
    lookup: Date,
    shouldTransform: function (type, val) {
      return val instanceof Date
    },
    toSerializable: function (date) {
      return date.getTime()
    },
    fromSerializable: function (val) {
      var date = new Date()
      date.setTime(val)
      return date
    },
  },
  {
    type: '[[RegExp]]',
    lookup: RegExp,
    shouldTransform: function (type, val) {
      return val instanceof RegExp
    },
    toSerializable: function (re) {
      var result = {
        src: re.source,
        flags: '',
      }
      if (re.global) result.flags += 'g'
      if (re.ignoreCase) result.flags += 'i'
      if (re.multiline) result.flags += 'm'
      return result
    },
    fromSerializable: function (val) {
      return new RegExp(val.src, val.flags)
    },
  },
  {
    type: '[[Error]]',
    lookup: Error,
    shouldTransform: function (type, val) {
      return val instanceof Error
    },
    toSerializable: function (err) {
      var _a, _b
      if (!err.stack) {
        ;(_b = (_a = Error).captureStackTrace) === null || _b === void 0
          ? void 0
          : _b.call(_a, err)
      }
      return {
        name: err.name,
        message: err.message,
        stack: err.stack,
      }
    },
    fromSerializable: function (val) {
      var Ctor = GLOBAL[val.name] || Error
      // @ts-ignore
      var err = new Ctor(val.message)
      err.stack = val.stack
      return err
    },
  },
  {
    type: '[[ArrayBuffer]]',
    lookup: ARRAY_BUFFER_SUPPORTED && ArrayBuffer,
    shouldTransform: function (type, val) {
      return ARRAY_BUFFER_SUPPORTED && val instanceof ArrayBuffer
    },
    toSerializable: function (buffer) {
      var view = new Int8Array(buffer)
      return arrSlice.call(view)
    },
    fromSerializable: function (val) {
      if (ARRAY_BUFFER_SUPPORTED) {
        var buffer = new ArrayBuffer(val.length)
        var view = new Int8Array(buffer)
        view.set(val)
        return buffer
      }
      return val
    },
  },
  {
    type: '[[TypedArray]]',
    shouldTransform: function (type, val) {
      if (ARRAY_BUFFER_SUPPORTED) {
        return ArrayBuffer.isView(val) && !(val instanceof DataView)
      }
      for (
        var _i = 0, TYPED_ARRAY_CTORS_1 = TYPED_ARRAY_CTORS;
        _i < TYPED_ARRAY_CTORS_1.length;
        _i++
      ) {
        var ctorName = TYPED_ARRAY_CTORS_1[_i]
        if (
          typeof GLOBAL[ctorName] === 'function' &&
          val instanceof GLOBAL[ctorName]
        )
          return true
      }
      return false
    },
    toSerializable: function (arr) {
      return {
        ctorName: arr.constructor.name,
        arr: arrSlice.call(arr),
      }
    },
    fromSerializable: function (val) {
      return typeof GLOBAL[val.ctorName] === 'function'
        ? // @ts-ignore
          new GLOBAL[val.ctorName](val.arr)
        : val.arr
    },
  },
  {
    type: '[[Map]]',
    lookup: MAP_SUPPORTED && Map,
    shouldTransform: function (type, val) {
      return MAP_SUPPORTED && val instanceof Map
    },
    toSerializable: function (map) {
      var flattenedKVArr = []
      map.forEach(function (val, key) {
        flattenedKVArr.push(key)
        flattenedKVArr.push(val)
      })
      return flattenedKVArr
    },
    fromSerializable: function (val) {
      if (MAP_SUPPORTED) {
        // NOTE: new Map(iterable) is not supported by all browsers
        var map = new Map()
        for (var i = 0; i < val.length; i += 2) map.set(val[i], val[i + 1])
        return map
      }
      var kvArr = []
      // @ts-ignore
      for (var j = 0; j < val.length; j += 2) kvArr.push([val[i], val[i + 1]])
      return kvArr
    },
  },
  {
    type: '[[Set]]',
    lookup: SET_SUPPORTED && Set,
    shouldTransform: function (type, val) {
      return SET_SUPPORTED && val instanceof Set
    },
    toSerializable: function (set) {
      var arr = []
      set.forEach(function (val) {
        arr.push(val)
      })
      return arr
    },
    fromSerializable: function (val) {
      if (SET_SUPPORTED) {
        // NOTE: new Set(iterable) is not supported by all browsers
        var set = new Set()
        for (var i = 0; i < val.length; i++) set.add(val[i])
        return set
      }
      return val
    },
  },
]
// Replicator
var Replicator = /** @class */ (function () {
  function Replicator(serializer) {
    this.transforms = []
    this.transformsMap = Object.create(null)
    this.serializer = serializer || JSONSerializer
    this.addTransforms(builtInTransforms)
  }
  Replicator.prototype.addTransforms = function (transforms) {
    transforms = Array.isArray(transforms) ? transforms : [transforms]
    for (
      var _i = 0, transforms_1 = transforms;
      _i < transforms_1.length;
      _i++
    ) {
      var transform = transforms_1[_i]
      if (this.transformsMap[transform.type])
        throw new Error(
          'Transform with type "' + transform.type + '" was already added.'
        )
      this.transforms.push(transform)
      this.transformsMap[transform.type] = transform
    }
    return this
  }
  Replicator.prototype.removeTransforms = function (transforms) {
    transforms = Array.isArray(transforms) ? transforms : [transforms]
    for (
      var _i = 0, transforms_2 = transforms;
      _i < transforms_2.length;
      _i++
    ) {
      var transform = transforms_2[_i]
      var idx = this.transforms.indexOf(transform)
      if (idx > -1) this.transforms.splice(idx, 1)
      delete this.transformsMap[transform.type]
    }
    return this
  }
  Replicator.prototype.encode = function (val) {
    var transformer = new EncodingTransformer(val, this.transforms)
    var references = transformer.transform()
    return this.serializer.serialize(references)
  }
  Replicator.prototype.decode = function (val) {
    var references = this.serializer.deserialize(val)
    var transformer = new DecodingTransformer(references, this.transformsMap)
    return transformer.transform()
  }
  return Replicator
})()
exports['default'] = Replicator
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvVHJhbnNmb3JtL3JlcGxpY2F0b3IvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxRQUFRO0FBQ1IsSUFBTSxvQkFBb0IsR0FBRyxJQUFJLENBQUE7QUFDakMsSUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUE7QUFDN0IsSUFBTSx1QkFBdUIsR0FBRyxZQUFZLENBQUE7QUFFNUMsSUFBTSxNQUFNLEdBQUcsQ0FBQyxTQUFTLFNBQVM7SUFDaEMsaUdBQWlHO0lBQ2pHLHlCQUF5QjtJQUV6QiwyQkFBMkI7SUFDM0IsMkNBQTJDO0lBQzNDLE9BQU8sTUFBTSxDQUFBO0FBQ2YsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtBQUVKLElBQU0sc0JBQXNCLEdBQUcsT0FBTyxXQUFXLEtBQUssVUFBVSxDQUFBO0FBQ2hFLElBQU0sYUFBYSxHQUFHLE9BQU8sR0FBRyxLQUFLLFVBQVUsQ0FBQTtBQUMvQyxJQUFNLGFBQWEsR0FBRyxPQUFPLEdBQUcsS0FBSyxVQUFVLENBQUE7QUFFL0MsSUFBTSxpQkFBaUIsR0FBRztJQUN4QixXQUFXO0lBQ1gsWUFBWTtJQUNaLG1CQUFtQjtJQUNuQixZQUFZO0lBQ1osYUFBYTtJQUNiLFlBQVk7SUFDWixhQUFhO0lBQ2IsY0FBYztJQUNkLGNBQWM7Q0FDZixDQUFBO0FBRUQsd0JBQXdCO0FBQ3hCLElBQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFBO0FBRXRDLHFCQUFxQjtBQUNyQixJQUFNLGNBQWMsR0FBRztJQUNyQixTQUFTLEVBQVQsVUFBVSxHQUFRO1FBQ2hCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUM1QixDQUFDO0lBRUQsV0FBVyxFQUFYLFVBQVksR0FBUTtRQUNsQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7SUFDeEIsQ0FBQztD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
