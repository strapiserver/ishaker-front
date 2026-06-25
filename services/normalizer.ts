const normalize = (data: any): any => {
  const isObject = (val: any) =>
    Object.prototype.toString.call(val) === "[object Object]";
  const isArray = (val: any) =>
    Object.prototype.toString.call(val) === "[object Array]";

  const flatten = (item: any) => {
    if (!item?.attributes) return item;
    return { id: item.id, ...item.attributes };
  };

  if (isArray(data)) {
    return data.map((item: any) => normalize(item));
  }

  if (isObject(data)) {
    if (isArray(data.data)) {
      data = [...data.data];
    } else if (isObject(data.data)) {
      data = flatten({ ...data.data });
    } else if (data.data === null) {
      data = null;
    } else {
      data = flatten(data);
    }

    for (const key in data) {
      data[key] = normalize(data[key]);
    }

    return data;
  }

  return data;
};

export default normalize;
