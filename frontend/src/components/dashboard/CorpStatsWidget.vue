<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    corpStats: {
        type: Array,
        required: true
    },
    totalKrews: {
        type: Number,
        required: true
    }
});

const allStatsDialog = ref(false);

const topCorpStats = computed(() => {
    return props.corpStats.slice(0, 6);
});

const hasMore = computed(() => {
    return props.corpStats.length > 6;
});

const getCorpColorClass = (corp) => {
    const colorMap = {
        '그립컴퍼니': 'bg-lime-500',
        '디케이테크인': 'bg-red-400',
        '링키지랩': 'bg-emerald-500',
        '볼트업': 'bg-violet-500',
        '서울아레나': 'bg-fuchsia-500',
        '에이엑스지': 'bg-amber-500',
        '엑스엘게임즈': 'bg-slate-500',
        '카카오': 'bg-yellow-500',
        '카카오게임즈': 'bg-purple-500',
        '카카오모빌리티': 'bg-indigo-500',
        '카카오뱅크': 'bg-yellow-600',
        '카카오스타일': 'bg-pink-500',
        '카카오엔터테인먼트': 'bg-red-500',
        '카카오엔터프라이즈': 'bg-blue-600',
        '카카오임팩트': 'bg-green-500',
        '카카오페이': 'bg-orange-500',
        '카카오페이증권': 'bg-cyan-500',
        '카카오헬스케어': 'bg-teal-500',
        '카카오VX': 'bg-blue-500',
        '케이드라이브': 'bg-gray-500',
        '케이앤웍스': 'bg-neutral-500',
        '케이엠파크': 'bg-sky-500',
        '키이스트': 'bg-zinc-500',
        'SM엔터테인먼트': 'bg-rose-500',
    };
    return colorMap[corp] || 'bg-gray-400';
};

const getCorpTextColorClass = (corp) => {
    const colorMap = {
        '그립컴퍼니': 'text-lime-500',
        '디케이테크인': 'text-red-400',
        '링키지랩': 'text-emerald-500',
        '볼트업': 'text-violet-500',
        '서울아레나': 'text-fuchsia-500',
        '에이엑스지': 'text-amber-500',
        '엑스엘게임즈': 'text-slate-500',
        '카카오': 'text-yellow-500',
        '카카오게임즈': 'text-purple-500',
        '카카오모빌리티': 'text-indigo-500',
        '카카오뱅크': 'text-yellow-600',
        '카카오스타일': 'text-pink-500',
        '카카오엔터테인먼트': 'text-red-500',
        '카카오엔터프라이즈': 'text-blue-600',
        '카카오임팩트': 'text-green-500',
        '카카오페이': 'text-orange-500',
        '카카오페이증권': 'text-cyan-500',
        '카카오헬스케어': 'text-teal-500',
        '카카오VX': 'text-blue-500',
        '케이드라이브': 'text-gray-500',
        '케이앤웍스': 'text-neutral-500',
        '케이엠파크': 'text-sky-500',
        '키이스트': 'text-zinc-500',
        'SM엔터테인먼트': 'text-rose-500',
    };
    return colorMap[corp] || 'text-gray-400';
};

const getPercentage = (count) => {
    return props.totalKrews > 0
        ? Math.round((count / props.totalKrews) * 100)
        : 0;
};

function showAllStats() {
    allStatsDialog.value = true;
}
</script>

<template>
    <div class="card h-full flex flex-col">
        <div class="flex justify-between items-center mb-6">
            <div class="font-semibold text-xl">법인별 통계</div>
            <Button
                v-if="hasMore"
                label="전체 보기"
                icon="pi pi-external-link"
                text
                size="small"
                @click="showAllStats"
            />
        </div>

        <ul class="list-none p-0 m-0 flex-1">
            <li
                v-for="(stat, index) in topCorpStats"
                :key="index"
                class="flex flex-col md:flex-row md:items-center md:justify-between mb-6"
            >
                <div>
                    <span class="text-surface-900 dark:text-surface-0 font-medium mr-2 mb-1 md:mb-0">
                        {{ stat.corp }}
                    </span>
                    <div class="mt-1 text-muted-color">
                        {{ stat.count.toLocaleString() }}명
                    </div>
                </div>
                <div class="mt-2 md:mt-0 flex items-center">
                    <div class="bg-surface-300 dark:bg-surface-500 rounded-border overflow-hidden w-40 lg:w-24" style="height: 8px">
                        <div
                            :class="`${getCorpColorClass(stat.corp)} h-full`"
                            :style="`width: ${getPercentage(stat.count)}%`"
                        ></div>
                    </div>
                    <span
                        :class="`${getCorpTextColorClass(stat.corp)} ml-4 font-medium`"
                    >
                        {{ getPercentage(stat.count) }}%
                    </span>
                </div>
            </li>
        </ul>
    </div>

    <!-- 전체 통계 다이얼로그 -->
    <Dialog
        v-model:visible="allStatsDialog"
        :style="{ width: '700px', maxHeight: '80vh' }"
        header="전체 법인 통계"
        :modal="true"
    >
        <div class="flex flex-col gap-4 max-h-96 overflow-y-auto">
            <div
                v-for="(stat, index) in corpStats"
                :key="index"
                class="flex items-center justify-between p-4 border border-surface-200 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
            >
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-3">
                        <!-- 색상 표시 -->
                        <div :class="`w-4 h-4 rounded-full ${getCorpColorClass(stat.corp)}`"></div>
                        <span class="font-semibold text-surface-900 dark:text-surface-0 text-lg">
                            {{ stat.corp }}
                        </span>
                        <Tag
                            :value="`${getPercentage(stat.count)}%`"
                            :severity="getPercentage(stat.count) > 30 ? 'success' : 'info'"
                        />
                    </div>
                    <div class="text-muted-color mb-2">
                        {{ stat.count.toLocaleString() }}명 / {{ totalKrews.toLocaleString() }}명
                    </div>
                    <div class="bg-surface-300 dark:bg-surface-500 rounded-border overflow-hidden" style="height: 8px">
                        <div
                            :class="`${getCorpColorClass(stat.corp)} h-full transition-all duration-300`"
                            :style="`width: ${getPercentage(stat.count)}%`"
                        ></div>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <Button
                label="닫기"
                icon="pi pi-times"
                text
                @click="allStatsDialog = false"
            />
        </template>
    </Dialog>
</template>
