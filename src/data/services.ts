import { Service } from '../types';

export const services: Service[] = [
  {
    id: 'bazi',
    titleKey: 'baziTitle',
    descriptionKey: 'baziDescription',
    price: '$120',
    duration: '90',
    icon: 'Calendar',
  },
  {
    id: 'dailyfortune',
    titleKey: 'dailyFortuneTitle',
    descriptionKey: 'dailyFortuneDescription',
    price: '$200',
    duration: '120',
    icon: 'Home',
  },
  {
    id: 'tarot',
    titleKey: 'tarotTitle',
    descriptionKey: 'tarotDescription',
    price: '$80',
    duration: '60',
    icon: 'Sparkles',
  },
  {
    id: 'luckyitems',
    titleKey: 'luckyItemsTitle',
    descriptionKey: 'luckyItemsDescription',
    price: '$100',
    duration: '75',
    icon: 'Calculator',
  },
];