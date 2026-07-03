export * from './database';
/* eslint-disable no-unused-vars */
export {};
declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
  }
  namespace google {
    namespace translate {
      class TranslateElement {
        constructor(options: {
          pageLanguage: string;
          includedLanguages?: string;
          autoDisplay?: boolean;
        }, elementId: string);
      }
    }
  }
}
/* eslint-enable no-unused-vars */
