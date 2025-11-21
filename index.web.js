// Web-specific entry that loads a small shim before expo-router's entry
// so that packages which expect certain Babel runtime helpers at runtime
// (prebuilt packages under node_modules) do not crash on web.

import './shim-babel-helpers';
import 'expo-router/entry';
