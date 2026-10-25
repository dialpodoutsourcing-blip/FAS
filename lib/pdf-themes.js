'use strict';

const DEFAULT_THEME='editorial-strategy';
const THEMES={
  'editorial-strategy':{
    key:'editorial-strategy',name:'Editorial Strategy',mode:'dark',fontMode:'sans',
    colors:{background:'#090907',surface:'#15130f',surfaceAlt:'#111915',text:'#F6F0E6',muted:'#A69D8F',accent:'#D5AD68',accentAlt:'#65C29B',line:'#383124',danger:'#D87B55'}
  },
  'luxury-editorial':{
    key:'luxury-editorial',name:'Luxury Editorial',mode:'light',fontMode:'serif',
    colors:{background:'#F1EADF',surface:'#FBF8F1',surfaceAlt:'#E5D5B9',text:'#211C16',muted:'#6C5E4C',accent:'#A97B39',accentAlt:'#6D806D',line:'#CDBB9C',danger:'#A6533D'}
  },
  'boardroom-consultancy':{
    key:'boardroom-consultancy',name:'Boardroom Consultancy',mode:'light',fontMode:'sans',
    colors:{background:'#F4F5F1',surface:'#FFFFFF',surfaceAlt:'#E2ECE8',text:'#17201E',muted:'#63716D',accent:'#1C5148',accentAlt:'#B88943',line:'#C9D3CF',danger:'#A65346'}
  }
};

function normalizeTheme(value){return Object.prototype.hasOwnProperty.call(THEMES,value)?value:DEFAULT_THEME;}

module.exports={DEFAULT_THEME,THEMES,normalizeTheme};
