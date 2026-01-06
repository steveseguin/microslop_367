"use strict";

exports.__esModule = true;
require("core-js/modules/es.error.cause.js");
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * An abstract class that defines the structure of an undo/redo action.
 *
 * @class BaseAction
 * @private
 */
class BaseAction {
  constructor(actionType) {
    /**
     * @param {string} actionType The action type.
     */
    _defineProperty(this, "actionType", '');
    this.actionType = actionType;
  }
  undo() {
    throw new Error('Not implemented');
  }
  redo() {
    throw new Error('Not implemented');
  }
}
exports.BaseAction = BaseAction;