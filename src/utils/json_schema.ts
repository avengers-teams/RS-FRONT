// 对于 enum array 需要设置 uniqueItems 才能渲染为复选框
function setUniqueItemsForEnumProperties(obj: any) {
  if (obj['type'] == 'array' && obj['items']) {
    obj['uniqueItems'] = true;
  }
  if (obj['properties'] != undefined) {
    // 递归遍历
    for (const key in obj['properties']) {
      setUniqueItemsForEnumProperties(obj['properties'][key]);
    }
  } else if (obj['allOf'] != undefined) {
    if (obj['allOf'][0]['properties'] != undefined) {
      // console.log(obj['allOf'][0]);
      for (const key in obj['allOf'][0]['properties']) {
        setUniqueItemsForEnumProperties(obj['allOf'][0]['properties'][key]);
      }
    }
  }
}

function fixModelOptionalTypeAnyOf(model: any) {
  if (model['properties'] == undefined) {
    return;
  }
  const requiredProperties = model['required'] || [];
  for (const key in model['properties']) {
    const property = model['properties'][key];
    if (requiredProperties.indexOf(key) == -1 && property['anyOf'] != undefined) {
      const anyOf = property['anyOf'] as Array<any>;
      let hasNull = false;
      for (const item of anyOf) {
        if (item['type'] == 'null') {
          hasNull = true;
          break;
        }
      }
      if (hasNull) {
        delete property['anyOf'];
        property['type'] = anyOf[0]['type'];
      }
    }
    if (property['allOf'] != undefined) {
      for (const item of property['allOf']) {
        fixModelOptionalTypeAnyOf(item);
      }
    }
  }
}

export function fixModelSchema(model: any) {
  setUniqueItemsForEnumProperties(model);
  fixModelOptionalTypeAnyOf(model);
}
