// Provide missing Babel helper(s) that some packages expect at runtime

// _objectWithoutPropertiesLoose — for object spread syntax
if (typeof globalThis._objectWithoutPropertiesLoose !== 'function') {
  globalThis._objectWithoutPropertiesLoose = function (source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;

    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }
    return target;
  };
}

// _interopRequireDefault — for default imports (import Foo from 'bar')
if (typeof globalThis._interopRequireDefault !== 'function') {
  globalThis._interopRequireDefault = function (obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  };
}

// _getPrototypeOf — for prototype inheritance
if (typeof globalThis._getPrototypeOf !== 'function') {
  globalThis._getPrototypeOf = Object.getPrototypeOf;
}

// _setPrototypeOf — for prototype setting
if (typeof globalThis._setPrototypeOf !== 'function') {
  globalThis._setPrototypeOf = Object.setPrototypeOf || function (o, p) {
    o.__proto__ = p;
    return o;
  };
}

// Assign to window for web compatibility
if (typeof window !== 'undefined') {
  window._objectWithoutPropertiesLoose = globalThis._objectWithoutPropertiesLoose;
  window._interopRequireDefault = globalThis._interopRequireDefault;
  window._getPrototypeOf = globalThis._getPrototypeOf;
  window._setPrototypeOf = globalThis._setPrototypeOf;
}
