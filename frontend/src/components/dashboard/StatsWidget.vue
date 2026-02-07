<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    stats: {
        type: Object,
        required: true
    }
});

const corpDialog = ref(false);

const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
};

function showCorpDialog() {
    corpDialog.value = true;
}
</script>

<template>
    <!-- 전체 조합원 -->
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">전체 조합원</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                        {{ formatNumber(stats.totalKrews) }}
                    </div>
                </div>
                <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-users text-blue-500 text-xl!"></i>
                </div>
            </div>
            <div class="flex items-center h-8">
                <span class="text-primary font-medium">{{ formatNumber(stats.newKrews) }}명 &nbsp</span>
                <span class="text-muted-color">신규 등록</span>
            </div>
        </div>
    </div>

    <!-- 전체 법인 (더보기 버튼 추가) -->
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">전체 법인</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                        {{ formatNumber(stats.totalCorps) }}
                    </div>
                </div>
                <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-building text-orange-500 text-xl!"></i>
                </div>
            </div>
            <div class="flex items-center h-8">
                <Button
                    label="법인 목록 보기"
                    icon="pi pi-eye"
                    text
                    size="small"
                    @click="showCorpDialog"
                    class="p-0 h-full"
                />
            </div>
        </div>
    </div>


    <!-- 코나카드 등록 -->
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">코나카드 등록</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                        {{ formatNumber(stats.registeredKonacards) }}
                    </div>
                </div>
                <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-id-card text-cyan-500 text-xl!"></i>
                </div>
            </div>
            <div class="flex items-center h-8">
                <span class="text-primary font-medium">{{ stats.konacardRate }}% &nbsp</span>
                <span class="text-muted-color">등록률</span>
            </div>
        </div>
    </div>

    <!-- CMS 등록성공 -->
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">CMS 등록성공</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                        {{ formatNumber(stats.activeStatus) }}
                    </div>
                </div>
                <div class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-check-circle text-green-500 text-xl!"></i>
                </div>
            </div>
            <div class="flex items-center h-8">
                <span class="text-primary font-medium">{{ stats.activeRate }}% &nbsp</span>
                <span class="text-muted-color">등록률</span>
            </div>
        </div>
    </div>

    <!-- 법인 목록 다이얼로그 -->
    <Dialog
        v-model:visible="corpDialog"
        :style="{ width: '450px' }"
        header="전체 법인 목록"
        :modal="true"
    >
        <div class="flex flex-col gap-3">
            <div
                v-for="(corp, index) in stats.corpNames"
                :key="index"
                class="flex items-center justify-between p-3 border border-surface-200 rounded-lg"
            >
                <div class="flex items-center gap-3">
                    <div class="flex items-center justify-center bg-primary-100 dark:bg-primary-400/10 rounded-full" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-building text-primary-500"></i>
                    </div>
                    <span class="font-medium text-surface-900 dark:text-surface-0">{{ corp }}</span>
                </div>
                <Tag :value="corp" severity="info" />
            </div>
        </div>

        <template #footer>
            <Button
                label="닫기"
                icon="pi pi-times"
                text
                @click="corpDialog = false"
            />
        </template>
    </Dialog>
</template>
