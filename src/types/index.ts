export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

export interface Service {
  id: string;
  titleKey: string;
  descriptionKey: string;
  price: string;
  duration: string;
  icon: string;
}