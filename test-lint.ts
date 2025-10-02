// Test file for pre-commit hook
console.log("This should trigger a linting error");

const testFunction = (param: any) => {
  console.log(param);
  return param;
};

export default testFunction;
