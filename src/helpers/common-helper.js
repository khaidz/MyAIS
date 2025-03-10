export const isNotNull = (input) => {
  return input !== null || input !== undefined;
};

export const generateGUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const tranformApiData = (data) => {
  try {
    if (data === null || data === undefined) return null;
    const transformedData = {};
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && ('$ref' in value || '$id' in value)) {
        transformedData[key] = null;
      } else {
        transformedData[key] = value;
      }
    }
    return transformedData;
  } catch (error) {
    return data;
  }
};
