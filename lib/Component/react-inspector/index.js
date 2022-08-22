'use strict'
var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b
          }) ||
        function (d, b) {
          for (var p in b)
            if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]
        }
      return extendStatics(d, b)
    }
    return function (d, b) {
      extendStatics(d, b)
      function __() {
        this.constructor = d
      }
      d.prototype =
        b === null ? Object.create(b) : ((__.prototype = b.prototype), new __())
    }
  })()
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i]
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p]
        }
        return t
      }
    return __assign.apply(this, arguments)
  }
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        Object.defineProperty(o, k2, {
          enumerable: true,
          get: function () {
            return m[k]
          },
        })
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        o[k2] = m[k]
      })
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v })
      }
    : function (o, v) {
        o['default'] = v
      })
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod
    var result = {}
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k)
    __setModuleDefault(result, mod)
    return result
  }
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
exports.__esModule = true
// @ts-nocheck
var react_1 = require('@emotion/react')
var React = __importStar(require('react'))
var react_inspector_1 = require('react-inspector')
var Error_1 = __importDefault(require('../message-parsers/Error'))
var elements_1 = require('./elements')
var CustomObjectLabel = function (_a) {
  var name = _a.name,
    data = _a.data,
    _b = _a.isNonenumerable,
    isNonenumerable = _b === void 0 ? false : _b
  return React.createElement(
    'span',
    null,
    typeof name === 'string'
      ? React.createElement(react_inspector_1.ObjectName, {
          name: name,
          dimmed: isNonenumerable,
        })
      : React.createElement(react_inspector_1.ObjectPreview, { data: name }),
    React.createElement('span', null, ': '),
    React.createElement(react_inspector_1.ObjectValue, { object: data })
  )
}
var CustomInspector = /** @class */ (function (_super) {
  __extends(CustomInspector, _super)
  function CustomInspector() {
    return (_super !== null && _super.apply(this, arguments)) || this
  }
  CustomInspector.prototype.render = function () {
    var _a = this.props,
      data = _a.data,
      theme = _a.theme
    var styles = theme.styles,
      method = theme.method
    var dom = data instanceof HTMLElement
    var table = method === 'table'
    return React.createElement(
      elements_1.Root,
      { 'data-type': table ? 'table' : dom ? 'html' : 'object' },
      table
        ? React.createElement(
            elements_1.Table,
            null,
            React.createElement(
              react_inspector_1.Inspector,
              __assign({}, this.props, { theme: styles, table: true })
            ),
            React.createElement(
              react_inspector_1.Inspector,
              __assign({}, this.props, { theme: styles })
            )
          )
        : dom
        ? React.createElement(
            elements_1.HTML,
            null,
            React.createElement(
              react_inspector_1.Inspector,
              __assign({}, this.props, { theme: styles })
            )
          )
        : React.createElement(
            react_inspector_1.Inspector,
            __assign({}, this.props, {
              theme: styles,
              nodeRenderer: this.nodeRenderer.bind(this),
            })
          )
    )
  }
  CustomInspector.prototype.getCustomNode = function (data) {
    var _a
    var styles = this.props.theme.styles
    var constructor =
      (_a = data === null || data === void 0 ? void 0 : data.constructor) ===
        null || _a === void 0
        ? void 0
        : _a.name
    if (constructor === 'Function')
      return React.createElement(
        'span',
        { style: { fontStyle: 'italic' } },
        React.createElement(react_inspector_1.ObjectPreview, { data: data }),
        ' {',
        React.createElement(
          'span',
          { style: { color: 'rgb(181, 181, 181)' } },
          data.body
        ),
        '}'
      )
    if (data instanceof Error && typeof data.stack === 'string') {
      return React.createElement(Error_1['default'], { error: data.stack })
    }
    if (constructor === 'Promise')
      return React.createElement(
        'span',
        { style: { fontStyle: 'italic' } },
        'Promise ',
        '{',
        React.createElement('span', { style: { opacity: 0.6 } }, '<pending>'),
        '}'
      )
    if (data instanceof HTMLElement)
      return React.createElement(
        elements_1.HTML,
        null,
        React.createElement(react_inspector_1.Inspector, {
          data: data,
          theme: styles,
        })
      )
    return null
  }
  CustomInspector.prototype.nodeRenderer = function (props) {
    var depth = props.depth,
      name = props.name,
      data = props.data,
      isNonenumerable = props.isNonenumerable
    // Root
    if (depth === 0) {
      var customNode_1 = this.getCustomNode(data)
      return (
        customNode_1 ||
        React.createElement(react_inspector_1.ObjectRootLabel, {
          name: name,
          data: data,
        })
      )
    }
    if (name === 'constructor')
      return React.createElement(
        elements_1.Constructor,
        null,
        React.createElement(react_inspector_1.ObjectLabel, {
          name: '<constructor>',
          data: data.name,
          isNonenumerable: isNonenumerable,
        })
      )
    var customNode = this.getCustomNode(data)
    return customNode
      ? React.createElement(
          elements_1.Root,
          null,
          React.createElement(react_inspector_1.ObjectName, { name: name }),
          React.createElement('span', null, ': '),
          customNode
        )
      : React.createElement(CustomObjectLabel, {
          name: name,
          data: data,
          isNonenumerable: isNonenumerable,
        })
  }
  return CustomInspector
})(React.PureComponent)
exports['default'] = react_1.withTheme(CustomInspector)
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvQ29tcG9uZW50L3JlYWN0LWluc3BlY3Rvci9pbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsY0FBYztBQUNkLHdDQUEwQztBQUMxQywyQ0FBOEI7QUFDOUIsbURBUXdCO0FBR3hCLG1FQUFpRDtBQUNqRCx1Q0FBMkQ7QUFPM0QsSUFBTSxpQkFBaUIsR0FBRyxVQUFDLEVBQXVDO1FBQXJDLElBQUksVUFBQSxFQUFFLElBQUksVUFBQSxFQUFFLHVCQUF1QixFQUF2QixlQUFlLG1CQUFHLEtBQUssS0FBQTtJQUFPLE9BQUEsQ0FDckU7UUFDRyxPQUFPLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQzFCLG9CQUFDLDRCQUFVLElBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsZUFBZSxHQUFJLENBQ3BELENBQUMsQ0FBQyxDQUFDLENBQ0Ysb0JBQUMsK0JBQWEsSUFBQyxJQUFJLEVBQUUsSUFBSSxHQUFJLENBQzlCO1FBQ0QsdUNBQWU7UUFDZixvQkFBQyw2QkFBVyxJQUFDLE1BQU0sRUFBRSxJQUFJLEdBQUksQ0FDeEIsQ0FDUjtBQVZzRSxDQVV0RSxDQUFBO0FBRUQ7SUFBOEIsbUNBQStCO0lBQTdEOztJQXdHQSxDQUFDO0lBdkdDLGdDQUFNLEdBQU47UUFDUSxJQUFBLEtBQWtCLElBQUksQ0FBQyxLQUFLLEVBQTFCLElBQUksVUFBQSxFQUFFLEtBQUssV0FBZSxDQUFBO1FBQzFCLElBQUEsTUFBTSxHQUFhLEtBQUssT0FBbEIsRUFBRSxNQUFNLEdBQUssS0FBSyxPQUFWLENBQVU7UUFFaEMsSUFBTSxHQUFHLEdBQUcsSUFBSSxZQUFZLFdBQVcsQ0FBQTtRQUN2QyxJQUFNLEtBQUssR0FBRyxNQUFNLEtBQUssT0FBTyxDQUFBO1FBRWhDLE9B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
