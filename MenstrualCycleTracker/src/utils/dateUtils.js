export const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  export const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };