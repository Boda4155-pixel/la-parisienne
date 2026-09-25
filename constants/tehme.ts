export const Colors = {
  primary: '#B8944D',       // الذهبي الرئيسي
  primaryDark: '#96702E',   // الذهبي الداكن
  background: '#FAF8F3',    // عاجي / كريمي دافئ
  card: '#FFFFFF',          // خلفية البطاقات
  textPrimary: '#171717',   // النص الرئيسي
  textSecondary: '#777777', // النص الفرعي
  divider: '#EEE9E0',       // الفواصل
  
  // ألوان الحالات (Statuses)
  status: {
    pending: { bg: '#F2F2F2', text: '#666666' },
    pickedUp: { bg: '#E3F2FD', text: '#1976D2' },
    onTheWay: { bg: '#E8F5E9', text: '#2E7D32' },
    completed: { bg: '#E8F5E9', text: '#2E7D32' },
    cancelled: { bg: '#FFEBEE', text: '#C62828' },
  }
};

export const Shadows = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  }
};