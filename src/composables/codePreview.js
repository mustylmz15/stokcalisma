import { ref } from 'vue';
export default () => {
    let codeArr = ref([]);
    const toggleCode = (name) => {
        if (codeArr.value.includes(name)) {
            codeArr.value = codeArr.value.filter((d) => d != name);
        }
        else {
            codeArr.value.push(name);
        }
    };
    return { codeArr, toggleCode };
};
//# sourceMappingURL=codePreview.js.map