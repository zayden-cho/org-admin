<script setup>
import { ref, onMounted, watch } from 'vue';

import { useToast } from 'primevue/usetoast';

import { useLayout } from '@/layout/composables/layout';
import { EventsService } from '@/service/EventsService';

const toast = useToast();
const { layoutConfig, isDarkTheme } = useLayout();

// 상태
const events = ref([]);
const selectedEvent = ref(null);
const selectedYear = ref(null);
const yearOptions = ref([]);
const statistics = ref(null);
const loading = ref(false);

// 차트 데이터
const statusChartData = ref(null);
const monthlyChartData = ref(null);
const monthlyDetailChartData = ref(null);

// 차트 옵션
const doughnutChartOptions = ref(null);
const lineChartOptions = ref(null);
const barChartOptions = ref(null);

// ========================================
// 테마 컬러 설정 (Sakai 스타일)
// ========================================
function setChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    // 도넛 차트 옵션
    doughnutChartOptions.value = {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1, // 정사각형
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                    usePointStyle: true,
                    padding: 15
                },
                position: 'bottom'
            }
        }
    };

    // 라인 차트 옵션
    lineChartOptions.value = {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1.5, // 가로가 세로의 1.5배
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                    usePointStyle: true
                },
                position: 'bottom'
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            },
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    color: textColorSecondary,
                    callback: function (value) {
                        return value + '%';
                    }
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            }
        }
    };

    // 바 차트 옵션
    barChartOptions.value = {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 2.5, // 가로가 세로의 2.5배
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                    usePointStyle: true
                },
                position: 'top'
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    display: false,
                    drawBorder: false
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            }
        }
    };
}

// ========================================
// 차트 데이터 생성 (Sakai 스타일 컬러)
// ========================================
function setChartData() {
    if (!statistics.value) return;

    const documentStyle = getComputedStyle(document.documentElement);

    // 상태별 분포 (도넛 차트)
    const byStatus = statistics.value.byStatus || {};
    statusChartData.value = {
        labels: Object.keys(byStatus),
        datasets: [
            {
                data: Object.values(byStatus),
                backgroundColor: [
                    documentStyle.getPropertyValue('--p-green-500'),
                    documentStyle.getPropertyValue('--p-blue-500'),
                    documentStyle.getPropertyValue('--p-red-500'),
                    documentStyle.getPropertyValue('--p-orange-500'),
                    documentStyle.getPropertyValue('--p-gray-500')
                ],
                hoverBackgroundColor: [
                    documentStyle.getPropertyValue('--p-green-400'),
                    documentStyle.getPropertyValue('--p-blue-400'),
                    documentStyle.getPropertyValue('--p-red-400'),
                    documentStyle.getPropertyValue('--p-orange-400'),
                    documentStyle.getPropertyValue('--p-gray-400')
                ]
            }
        ]
    };

    // 월별 참석률 (라인 차트)
    const monthlyStats = statistics.value.monthlyStats || [];
    monthlyChartData.value = {
        labels: monthlyStats.map((m) => `${m.month}월`),
        datasets: [
            {
                label: '참석률 (%)',
                data: monthlyStats.map((m) => m.attendanceRate),
                borderColor: documentStyle.getPropertyValue('--p-green-500'),
                backgroundColor: documentStyle.getPropertyValue('--p-green-100'),
                tension: 0.4,
                fill: true
            }
        ]
    };

    // 월별 상세 (바 차트)
    monthlyDetailChartData.value = {
        labels: monthlyStats.map((m) => `${m.month}월`),
        datasets: [
            {
                label: '신청',
                data: monthlyStats.map((m) => m.applied),
                backgroundColor: documentStyle.getPropertyValue('--p-blue-500')
            },
            {
                label: '참석',
                data: monthlyStats.map((m) => m.attended),
                backgroundColor: documentStyle.getPropertyValue('--p-green-500')
            },
            {
                label: '취소',
                data: monthlyStats.map((m) => m.cancelled),
                backgroundColor: documentStyle.getPropertyValue('--p-red-500')
            },
            {
                label: '노쇼',
                data: monthlyStats.map((m) => m.noShow),
                backgroundColor: documentStyle.getPropertyValue('--p-orange-500')
            }
        ]
    };
}

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
            setChartData();

            // forceRefresh일 때만 토스트 표시
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
// 초기화 및 테마 감지
// ========================================
onMounted(async () => {
    setChartOptions();
    await loadEvents();
    if (selectedEvent.value) {
        await loadYears();
        if (selectedYear.value) {
            await loadStatistics();
        }
    }
});

// 테마 변경 감지 (Sakai 스타일)
watch(
    [() => layoutConfig.primary, () => layoutConfig.surface, isDarkTheme],
    () => {
        setChartOptions();
        setChartData();
    },
    { immediate: true }
);
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
                    <Select id="event-select" v-model="selectedEvent" :options="events" optionLabel="name" placeholder="행사를 선택하세요" class="w-full select-centered" :style="{ height: '44px' }" :disabled="loading">
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex items-center gap-2">
                                <Tag :value="slotProps.value.type" severity="info" size="small" />
                                <span>{{ slotProps.value.name }}</span>
                            </div>
                            <span v-else>행사를 선택하세요</span>
                        </template>
                        <template #option="slotProps">
                            <div class="flex items-center gap-2">
                                <Tag :value="slotProps.option.type" severity="info" size="small" />
                                <span>{{ slotProps.option.name }}</span>
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
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg" style="min-height: 100px; display: flex; flex-direction: column; justify-content: center">
                        <div class="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">총 신청</div>
                        <div class="text-3xl font-bold text-blue-700 dark:text-blue-300">{{ statistics.totalApplied }}</div>
                    </div>
                </div>

                <div class="col-span-6 md:col-span-3">
                    <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg" style="min-height: 100px; display: flex; flex-direction: column; justify-content: center">
                        <div class="text-sm text-green-600 dark:text-green-400 font-medium mb-1">참석</div>
                        <div class="text-3xl font-bold text-green-700 dark:text-green-300">{{ statistics.totalAttended }}</div>
                    </div>
                </div>

                <div class="col-span-6 md:col-span-3">
                    <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg" style="min-height: 100px; display: flex; flex-direction: column; justify-content: center">
                        <div class="text-sm text-red-600 dark:text-red-400 font-medium mb-1">취소</div>
                        <div class="text-3xl font-bold text-red-700 dark:text-red-300">{{ statistics.totalCancelled }}</div>
                    </div>
                </div>

                <div class="col-span-6 md:col-span-3">
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg" style="min-height: 100px; display: flex; flex-direction: column; justify-content: center">
                        <div class="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-1">노쇼</div>
                        <div class="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{{ statistics.totalNoShow }}</div>
                    </div>
                </div>
            </div>

            <!-- 비율 -->
            <div class="grid grid-cols-12 gap-4 mb-6">
                <div class="col-span-4">
                    <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center" style="min-height: 80px; display: flex; flex-direction: column; justify-content: center">
                        <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">참석률</div>
                        <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ statistics.attendanceRate }}%</div>
                    </div>
                </div>

                <div class="col-span-4">
                    <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center" style="min-height: 80px; display: flex; flex-direction: column; justify-content: center">
                        <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">취소율</div>
                        <div class="text-2xl font-bold text-red-600 dark:text-red-400">{{ statistics.cancellationRate }}%</div>
                    </div>
                </div>

                <div class="col-span-4">
                    <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center" style="min-height: 80px; display: flex; flex-direction: column; justify-content: center">
                        <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">노쇼율</div>
                        <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ statistics.noShowRate }}%</div>
                    </div>
                </div>
            </div>

            <!-- 차트 -->
            <div class="grid grid-cols-12 gap-6">
                <!-- 상태별 분포 (도넛) -->
                <div class="col-span-12 md:col-span-6">
                    <div class="card" style="height: 450px; display: flex; flex-direction: column">
                        <div class="font-semibold text-xl mb-4">상태별 분포</div>
                        <div style="flex: 1; display: flex; align-items: center; justify-content: center">
                            <Chart v-if="statusChartData" type="doughnut" :data="statusChartData" :options="doughnutChartOptions" style="width: 100%; height: 100%" />
                        </div>
                    </div>
                </div>

                <!-- 월별 참석률 (라인) -->
                <div class="col-span-12 md:col-span-6">
                    <div class="card" style="height: 450px; display: flex; flex-direction: column">
                        <div class="font-semibold text-xl mb-4">월별 참석률</div>
                        <div style="flex: 1">
                            <Chart v-if="monthlyChartData" type="line" :data="monthlyChartData" :options="lineChartOptions" style="height: 100%" />
                        </div>
                    </div>
                </div>

                <!-- 월별 상세 (바) -->
                <div class="col-span-12">
                    <div class="card" style="height: 450px; display: flex; flex-direction: column">
                        <div class="font-semibold text-xl mb-4">월별 신청 / 참석 / 취소 / 노쇼</div>
                        <div style="flex: 1">
                            <Chart v-if="monthlyDetailChartData" type="bar" :data="monthlyDetailChartData" :options="barChartOptions" style="height: 100%" />
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
