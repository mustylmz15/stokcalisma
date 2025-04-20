<template>
    <div class="relative custom-dropdown">
        <button
            type="button"
            class="flex items-center justify-between w-full px-3 py-2 text-sm bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700"
            @click="toggleDropdown"
            :disabled="disabled"
        >
            <span v-if="modelValue">{{ getOptionLabel(modelValue) }}</span>
            <span v-else class="text-gray-400">{{ placeholder }}</span>
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
        </button>

        <div
            v-if="isOpen"
            class="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-700"
        >
            <ul class="py-1 max-h-60 overflow-auto">
                <li
                    v-for="option in options"
                    :key="option.id"
                    @click="selectOption(option)"
                    class="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    {{ getOptionLabel(option) }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, defineProps, defineEmits, PropType } from 'vue';

interface Option {
    id: string | number;
    [key: string]: any;
}

const props = defineProps({
    modelValue: {
        type: Object as PropType<Option | null>,
        default: null
    },
    options: {
        type: Array as PropType<Option[]>,
        default: () => []
    },
    optionLabel: {
        type: String,
        default: 'label'
    },
    placeholder: {
        type: String,
        default: 'Seçiniz'
    },
    disabled: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue', 'change']);

const isOpen = ref(false);

const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
};

const selectOption = (option: Option) => {
    emit('update:modelValue', option);
    emit('change', option);
    isOpen.value = false;
};

const getOptionLabel = (option: Option) => {
    return option[props.optionLabel];
};

// Dışarı tıklandığında dropdown'ı kapat
const closeDropdown = (event) => {
    const dropdown = document.querySelector('.custom-dropdown');
    if (dropdown && !dropdown.contains(event.target)) {
        isOpen.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', closeDropdown);
});

onUnmounted(() => {
    document.removeEventListener('click', closeDropdown);
});
</script>

<style scoped>
.custom-dropdown {
    min-width: 150px;
}
</style>
