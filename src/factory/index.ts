/**
 * Praxis Rules Factory
 *
 * Public API for predefined rule modules.
 *
 * @example
 * ```ts
 * import { inputRules, toastRules, formRules } from '@plures/praxis/factory';
 * ```
 */

export {
  inputRules,
  toastRules,
  formRules,
  navigationRules,
  dataRules,
} from './factory.js';

export type {
  InputRulesConfig,
  ToastRulesConfig,
  FormRulesConfig,
  NavigationRulesConfig,
  DataRulesConfig,
  SanitizationType,
} from './types.js';
