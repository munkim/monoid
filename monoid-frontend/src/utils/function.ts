import { capitalizationLanguageNameMap } from './constants';

export const getCorrectCapitalizationLanguageName = ( language: string ) => {
  if ( !language ) return 'Plain';

  if ( language in capitalizationLanguageNameMap )
    return capitalizationLanguageNameMap[language];

  return language.charAt( 0 ).toUpperCase() + language.substring( 1 );
};
