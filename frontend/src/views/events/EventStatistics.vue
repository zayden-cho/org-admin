<script setup>
import { ref, computed, onMounted, watch } from 'vue';

import { useToast } from 'primevue/usetoast';

import { EventsService } from '@/service/EventsService';

const toast = useToast();

// 상태
const events = ref([]);
const selectedEvent = ref(null);
const selectedYear = ref(null);
const yearOptions = ref([]);
const statistics = ref(null);
const loading = ref(false);

// ========================================
// 연도 목록 로드
// ========================================
async function loadYears() {
    if (!selectedEvent.value) {
        yearOptions.value = [];
        return;
    }

    try {
        const response = await EventsService.getEventYears(selectedEvent.value.eventId);

        if (response.data.success) {
            yearOptions.value = response.data.data.map((year) => ({
                label: year,
                value: year
            }));

            // 첫 번째 연도 자동 선택
            if (yearOptions.value.length > 0 && !selectedYear.value) {
                selectedYear.value = yearOptions.value[0].value;
            }
        }
    } catch (error) {
        console.error('Failed to load years:', error);
        toast.add({
            severity: 'error',
            summary: '오류',
            detail: '연도 목록을 불러올 수 없습니다.',
            life: 3000
        });
        yearOptions.value = [];
    }
}

// ========================================
// 차트 데이터
// ========================================

// 상태별 분포 (도넛 차트)
const statusChartData = computed(() => {
    if (!statistics.value) return null;

    const 상태별분포 = statistics.value.상태별분포 || {};

    return {
        labels: Object.keys(상태별분포),
        datasets: [
            {
                data: Object.values(상태별분포),
                backgroundColor: ['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#6B7280'],
                hoverBackgroundColor: ['#059669', '#2563EB', '#DC2626', '#D97706', '#4B5563']
            }
        ]
    };
});

// 월별 참석률 (라인 차트)
const monthlyChartData = computed(() => {
    if (!statistics.value || !statistics.value.월별통계) return null;

    const 월별통계 = statistics.value.월별통계;

    return {
        labels: 월별통계.map((m) => `${m.month}월`),
        datasets: [
            {
                label: '참석률 (%)',
                data: 월별통계.map((m) => m.참석률),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }
        ]
    };
});

// 월별 신청/참석/취소/노쇼 (바 차트)
const monthlyDetailChartData = computed(() => {
    if (!statistics.value || !statistics.value.월별통계) return null;

    const 월별통계 = statistics.value.월별통계;

    return {
        labels: 월별통계.map((m) => `${m.month}월`),
        datasets: [
            {
                label: '신청',
                data: 월별통계.map((m) => m.신청),
                backgroundColor: '#3B82F6'
            },
            {
                label: '참석',
                data: 월별통계.map((m) => m.참석),
                backgroundColor: '#10B981'
            },
            {
                label: '취소',
                data: 월별통계.map((m) => m.취소),
                backgroundColor: '#EF4444'
            },
            {
                label: '노쇼',
                data: 월별통계.map((m) => m.노쇼),
                backgroundColor: '#F59E0B'
            }
        ]
    };
});

// ========================================
// 차트 옵션
// ========================================

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            position: 'bottom'
        }
    }
};

const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            position: 'bottom'
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            max: 100,
            ticks: {
                callback: function (value) {
                    return value + '%';
                }
            }
        }
    }
};

// ========================================
// 행사 목록 로드
// ========================================
async function loadEvents() {
    try {
        const response = await EventsService.getEvents();
        events.value = response.data.data || [];

        if (events.value.length > 0 && !selectedEvent.value) {
            selectedEvent.value = events.value[0];
        }
    } catch (error) {
        console.error('Failed to load events:', error);
        toast.add({
            severity: 'error',
            summary: '오류',
            detail: '행사 목록을 불러올 수 없습니다.',
            life: 3000
        });
    }
}

// ========================================
// 통계 데이터 로드
// ========================================
async function loadStatistics(forceRefresh = false) {
    if (!selectedEvent.value || !selectedYear.value) {
        return;
    }

    loading.value = true;

    try {
        const response = await EventsService.getEventStatistics(selectedEvent.value.eventId, selectedYear.value, forceRefresh);

        if (response.data.success) {
            statistics.value = response.data.data;

            // forceRefresh일 때만 토스트 표시 (Refresh 버튼 클릭 시)
            if (forceRefresh) {
                toast.add({
                    severity: 'success',
                    summary: '새로고침 완료',
                    detail: '최신 통계 데이터를 불러왔습니다.',
                    life: 2000
                });
            }
        } else {
            throw new Error(response.data.error || '통계를 불러올 수 없습니다.');
        }
    } catch (error) {
        console.error('Failed to load statistics:', error);
        toast.add({
            severity: 'error',
            summary: '오류',
            detail: '통계를 불러올 수 없습니다.',
            life: 3000
        });
        statistics.value = null;
    } finally {
        loading.value = false;
    }
}

// ========================================
// 새로고침
// ========================================
async function refreshStatistics() {
    await loadStatistics(true);
}

// ========================================
// 행사/연도 변경 감지
// ========================================
watch(selectedEvent, async () => {
    await loadYears();
});

watch([selectedEvent, selectedYear], () => {
    if (selectedEvent.value && selectedYear.value) {
        loadStatistics();
    }
});

// ========================================
// 초기화
// ========================================
onMounted(async () => {
    await loadEvents();
    if (selectedEvent.value) {
        await loadYears();
        if (selectedYear.value) {
            await loadStatistics();
        }
    }
});
</script>

<template>
    <div class="card">
        <!-- Filtering -->
        <div class="mb-6">
            <div class="flex items-center gap-3 mb-4" style="align-items: center">
                <div class="font-semibold text-xl" style="line-height: 1; margin: 0">Filtering</div>
                <Button label="Refresh" icon="pi pi-refresh" text severity="success" size="small" :loading="loading" @click="refreshStatistics" />
            </div>

            <!-- 필터 입력 필드들 -->
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-3">
                    <label for="event-select" class="block text-sm font-medium mb-2">행사 선택</label>
                    <Select id="event-select" v-model="selectedEvent" :options="events" optionLabel="이름" placeholder="행사를 선택하세요" class="w-full select-centered" :style="{ height: '44px' }" :disabled="loading">
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex items-center gap-2">
                                <Tag :value="slotProps.value.유형" severity="info" size="small" />
                                <span>{{ slotProps.value.이름 }}</span>
                            </div>
                            <span v-else>행사를 선택하세요</span>
                        </template>
                        <template #option="slotProps">
                            <div class="flex items-center gap-2">
                                <Tag :value="slotProps.option.유형" severity="info" size="small" />
                                <span>{{ slotProps.option.이름 }}</span>
                            </div>
                        </template>
                    </Select>
                </div>

                <div class="col-span-12 md:col-span-3">
                    <label for="year-select" class="block text-sm font-medium mb-2">연도 선택</label>
                    <Select
                        id="year-select"
                        v-model="selectedYear"
                        :options="yearOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="연도를 선택하세요"
                        class="w-full select-centered"
                        :style="{ height: '44px' }"
                        :disabled="loading || yearOptions.length === 0"
                    />
                </div>
            </div>
        </div>

        <!-- 로딩 -->
        <div v-if="loading" class="text-center p-8">
            <ProgressSpinner style="width: 50px; height: 50px" />
            <p class="text-gray-600 dark:text-gray-400 mt-4">통계를 불러오는 중...</p>
        </div>

        <!-- 통계 데이터 -->
        <div v-else-if="statistics">
            <!-- 요약 카드 -->
            <div class="grid grid-cols-12 gap-4 mb-6">
                <div class="col-span-6 md:col-span-3">
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div class="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">총 신청</div>
                        <div class="text-3xl font-bold text-blue-700 dark:text-blue-300">{{ statistics.총신청인원 }}</div>
                    </div>
                </div>

                <div class="col-span-6 md:col-span-3">
                    <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div class="text-sm text-green-600 dark:text-green-400 font-medium mb-1">참석</div>
                        <div class="text-3xl font-bold text-green-700 dark:text-green-300">{{ statistics.참석인원 }}</div>
                    </div>
                </div>

                <div class="col-span-6 md:col-span-3">
                    <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                        <div class="text-sm text-red-600 dark:text-red-400 font-medium mb-1">취소</div>
                        <div class="text-3xl font-bold text-red-700 dark:text-red-300">{{ statistics.취소인원 }}</div>
                    </div>
                </div>

                <div class="col-span-6 md:col-span-3">
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                        <div class="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-1">노쇼</div>
                        <div class="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{{ statistics.노쇼인원 }}</div>
                    </div>
                </div>
            </div>

            <!-- 비율 -->
            <div class="grid grid-cols-12 gap-4 mb-6">
                <div class="col-span-4">
                    <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                        <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">참석률</div>
                        <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ statistics.참석률 }}%</div>
                    </div>
                </div>

                <div class="col-span-4">
                    <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                        <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">취소율</div>
                        <div class="text-2xl font-bold text-red-600 dark:text-red-400">{{ statistics.취소율 }}%</div>
                    </div>
                </div>

                <div class="col-span-4">
                    <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                        <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">노쇼율</div>
                        <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ statistics.노쇼율 }}%</div>
                    </div>
                </div>
            </div>

            <!-- 차트 -->
            <div class="grid grid-cols-12 gap-6">
                <!-- 상태별 분포 (도넛) -->
                <div class="col-span-12 md:col-span-6">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-white">상태별 분포</h3>
                        <div style="height: 300px">
                            <Chart type="doughnut" :data="statusChartData" :options="chartOptions" />
                        </div>
                    </div>
                </div>

                <!-- 월별 참석률 (라인) -->
                <div class="col-span-12 md:col-span-6">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-white">월별 참석률</h3>
                        <div style="height: 300px">
                            <Chart type="line" :data="monthlyChartData" :options="lineChartOptions" />
                        </div>
                    </div>
                </div>

                <!-- 월별 상세 (바) -->
                <div class="col-span-12">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-white">월별 신청 / 참석 / 취소 / 노쇼</h3>
                        <div style="height: 400px">
                            <Chart type="bar" :data="monthlyDetailChartData" :options="chartOptions" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 데이터 없음 -->
        <div v-else class="text-center p-8">
            <i class="pi pi-chart-bar text-6xl text-gray-400 mb-4"></i>
            <p class="text-gray-600 dark:text-gray-400">행사와 연도를 선택하면 통계를 확인할 수 있습니다.</p>
        </div>
    </div>
</template>

<style scoped>
.card {
    padding: 2rem;
    background: var(--surface-card);
    border-radius: var(--content-border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 셀렉트박스 세로 가운데 정렬 */
:deep(.select-centered) {
    display: flex;
    align-items: center;
}

:deep(.select-centered .p-select-label) {
    display: flex;
    align-items: center;
    height: 100%;
}
</style>
