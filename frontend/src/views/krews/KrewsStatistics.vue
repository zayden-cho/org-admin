<script setup>
import { ref, onMounted, watch } from 'vue';

import { useToast } from 'primevue/usetoast';

import { useLayout } from '@/layout/composables/layout';
import { KrewsService } from '@/service/KrewsService';

const toast = useToast();
const { layoutConfig, isDarkTheme } = useLayout();

// 상태
const statistics = ref(null);
const loading = ref(false);

// 차트 데이터
const corpChartData = ref(null);
const konacardByCorpChartData = ref(null);
const checkoffChartData = ref(null);
const chatRoomChartData = ref(null);
const joinMonthChartData = ref(null);

// 차트 옵션
const barChartOptions = ref(null);
const stackedBarChartOptions = ref(null);
const doughnutChartOptions = ref(null);
const lineChartOptions = ref(null);

// ========================================
// 테마 컬러 설정 (Sakai 스타일)
// ========================================
function setChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    // 바 차트 옵션
    barChartOptions.value = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 0.5, // 세로로 길게
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                ticks: {
                    color: textColorSecondary,
                    stepSize: 50
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            },
            y: {
                ticks: {
                    color: textColorSecondary,
                    font: {
                        weight: 500
                    }
                },
                grid: {
                    display: false,
                    drawBorder: false
                }
            }
        }
    };

    // 스택 바 차트 옵션
    stackedBarChartOptions.value = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 0.5, // 세로로 길게
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
                stacked: true,
                beginAtZero: true,
                ticks: {
                    color: textColorSecondary,
                    stepSize: 50
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            },
            y: {
                stacked: true,
                ticks: {
                    color: textColorSecondary,
                    font: {
                        weight: 500
                    }
                },
                grid: {
                    display: false,
                    drawBorder: false
                }
            }
        }
    };

    // 도넛 차트 옵션
    doughnutChartOptions.value = {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1, // 정사각형으로 크게
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
        aspectRatio: 2.5, // 가로가 세로의 2.5배
        plugins: {
            legend: {
                display: false
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
                ticks: {
                    color: textColorSecondary,
                    stepSize: 5
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

    // 법인별 조합원 수 (바 차트)
    const byCorp = statistics.value.byCorp.slice(0, 15);
    corpChartData.value = {
        labels: byCorp.map((item) => item.corp),
        datasets: [
            {
                label: '조합원 수',
                data: byCorp.map((item) => item.total),
                backgroundColor: documentStyle.getPropertyValue('--p-primary-500'),
                borderColor: documentStyle.getPropertyValue('--p-primary-500')
            }
        ]
    };

    // 법인별 코나카드 등록률 (스택 바 차트)
    const konacardByCorp = statistics.value.konacardByCorp.slice(0, 15);
    konacardByCorpChartData.value = {
        labels: konacardByCorp.map((item) => item.corp),
        datasets: [
            {
                label: '등록',
                data: konacardByCorp.map((item) => item.registered),
                backgroundColor: documentStyle.getPropertyValue('--p-green-500'),
                borderColor: documentStyle.getPropertyValue('--p-green-500')
            },
            {
                label: '미등록',
                data: konacardByCorp.map((item) => item.notRegistered),
                backgroundColor: documentStyle.getPropertyValue('--p-red-400'),
                borderColor: documentStyle.getPropertyValue('--p-red-400')
            }
        ]
    };

    // 체크오프 대상 분포 (도넛 차트)
    const byCheckoff = statistics.value.byCheckoff;
    checkoffChartData.value = {
        labels: Object.keys(byCheckoff),
        datasets: [
            {
                data: Object.values(byCheckoff),
                backgroundColor: [documentStyle.getPropertyValue('--p-green-500'), documentStyle.getPropertyValue('--p-orange-500'), documentStyle.getPropertyValue('--p-indigo-500'), documentStyle.getPropertyValue('--p-red-500')],
                hoverBackgroundColor: [documentStyle.getPropertyValue('--p-green-400'), documentStyle.getPropertyValue('--p-orange-400'), documentStyle.getPropertyValue('--p-indigo-400'), documentStyle.getPropertyValue('--p-red-400')]
            }
        ]
    };

    // 조합원방 참여율 (도넛 차트)
    const chatRoomStats = statistics.value.chatRoomStats;
    chatRoomChartData.value = {
        labels: ['참여', '미참여'],
        datasets: [
            {
                data: [chatRoomStats.joined, chatRoomStats.notJoined],
                backgroundColor: [documentStyle.getPropertyValue('--p-green-500'), documentStyle.getPropertyValue('--p-red-400')],
                hoverBackgroundColor: [documentStyle.getPropertyValue('--p-green-400'), documentStyle.getPropertyValue('--p-red-300')]
            }
        ]
    };

    // 가입월별 분포 (라인 차트)
    const joinMonthDistribution = statistics.value.joinMonthDistribution;
    joinMonthChartData.value = {
        labels: joinMonthDistribution.map((item) => item.month),
        datasets: [
            {
                label: '가입 인원',
                data: joinMonthDistribution.map((item) => item.count),
                borderColor: documentStyle.getPropertyValue('--p-primary-500'),
                backgroundColor: documentStyle.getPropertyValue('--p-primary-100'),
                tension: 0.4,
                fill: true
            }
        ]
    };
}

// ========================================
// 통계 데이터 로드
// ========================================
async function loadStatistics(forceRefresh = false) {
    loading.value = true;

    try {
        const response = await KrewsService.getKrewsStatistics(forceRefresh);

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
// 초기화 및 테마 감지
// ========================================
onMounted(async () => {
    setChartOptions();
    await loadStatistics();
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
                <div class="font-semibold text-xl" style="line-height: 1; margin: 0">조합원 통계</div>
                <Button label="Refresh" icon="pi pi-refresh" text severity="success" size="small" :loading="loading" @click="refreshStatistics" />
            </div>
        </div>

        <!-- 로딩 -->
        <div v-if="loading" class="text-center p-8">
            <ProgressSpinner style="width: 50px; height: 50px" />
            <p class="text-gray-600 dark:text-gray-400 mt-4">통계를 불러오는 중...</p>
        </div>

        <!-- 통계 데이터 -->
        <div v-else-if="statistics">
            <!-- 1. 기본 통계 카드 (3개) -->
            <div class="grid grid-cols-12 gap-4 mb-6">
                <div class="col-span-12 md:col-span-4">
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex flex-col justify-center" style="min-height: 120px">
                        <div class="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">전체 조합원</div>
                        <div class="text-3xl font-bold text-blue-700 dark:text-blue-300">{{ statistics.total?.toLocaleString() || 0 }}명</div>
                    </div>
                </div>

                <div class="col-span-12 md:col-span-4">
                    <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex flex-col justify-center" style="min-height: 120px">
                        <div class="text-sm text-green-600 dark:text-green-400 font-medium mb-1">재직자</div>
                        <div class="text-3xl font-bold text-green-700 dark:text-green-300">{{ statistics.active?.toLocaleString() || 0 }}명</div>
                        <div class="text-xs text-green-600 dark:text-green-400 mt-1">등록성공 + 미납중 + 안내완료</div>
                    </div>
                </div>

                <div class="col-span-12 md:col-span-4">
                    <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg flex flex-col justify-center" style="min-height: 120px">
                        <div class="text-sm text-orange-600 dark:text-orange-400 font-medium mb-1">휴직자</div>
                        <div class="text-3xl font-bold text-orange-700 dark:text-orange-300">{{ statistics.onLeave?.toLocaleString() || 0 }}명</div>
                        <div class="text-xs text-orange-600 dark:text-orange-400 mt-1">일시정지</div>
                    </div>
                </div>
            </div>

            <!-- 2. CMS 등록 통계 + 코나카드 등록률 -->
            <div class="grid grid-cols-12 gap-4 mb-6">
                <!-- CMS 등록 통계 (4가지 상태) -->
                <div class="col-span-12 md:col-span-6">
                    <div class="card" style="height: 350px; display: flex; flex-direction: column">
                        <div class="font-semibold text-xl mb-4">CMS 등록 통계</div>

                        <div class="flex-1 flex flex-col justify-around">
                            <!-- 등록성공 -->
                            <div class="mb-3">
                                <div class="flex justify-content-between align-items-center mb-2">
                                    <span class="text-sm text-gray-600 dark:text-gray-400">등록성공:</span>
                                    <span class="font-bold text-green-600">&ensp;{{ statistics.cmsStats?.registered || 0 }}명</span>
                                </div>
                                <ProgressBar :value="statistics.total > 0 ? Math.round((statistics.cmsStats?.registered / statistics.total) * 100) : 0" :showValue="false" class="h-2" :pt="{ value: { class: 'bg-green-500' } }" />
                            </div>

                            <!-- 안내완료 -->
                            <div class="mb-3">
                                <div class="flex justify-content-between align-items-center mb-2">
                                    <span class="text-sm text-gray-600 dark:text-gray-400">안내완료:</span>
                                    <span class="font-bold text-blue-600">&ensp;{{ statistics.cmsStats?.notified || 0 }}명</span>
                                </div>
                                <ProgressBar :value="statistics.total > 0 ? Math.round((statistics.cmsStats?.notified / statistics.total) * 100) : 0" :showValue="false" class="h-2" :pt="{ value: { class: 'bg-blue-500' } }" />
                            </div>

                            <!-- 일시정지 -->
                            <div class="mb-3">
                                <div class="flex justify-content-between align-items-center mb-2">
                                    <span class="text-sm text-gray-600 dark:text-gray-400">일시정지:</span>
                                    <span class="font-bold text-red-600">&ensp;{{ statistics.cmsStats?.paused || 0 }}명</span>
                                </div>
                                <ProgressBar :value="statistics.total > 0 ? Math.round((statistics.cmsStats?.paused / statistics.total) * 100) : 0" :showValue="false" class="h-2" :pt="{ value: { class: 'bg-red-500' } }" />
                            </div>

                            <!-- 미납중 -->
                            <div class="mb-3">
                                <div class="flex justify-content-between align-items-center mb-2">
                                    <span class="text-sm text-gray-600 dark:text-gray-400">미납중:</span>
                                    <span class="font-bold text-yellow-600">&ensp;{{ statistics.cmsStats?.unpaid || 0 }}명</span>
                                </div>
                                <ProgressBar :value="statistics.total > 0 ? Math.round((statistics.cmsStats?.unpaid / statistics.total) * 100) : 0" :showValue="false" class="h-2" :pt="{ value: { class: 'bg-yellow-500' } }" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 코나카드 등록률 -->
                <div class="col-span-12 md:col-span-6">
                    <div class="card" style="height: 350px; display: flex; flex-direction: column">
                        <div class="font-semibold text-xl mb-4">코나카드 등록률</div>
                        <div class="flex-1 flex flex-col justify-center">
                            <div class="mb-4">
                                <div class="flex justify-content-between align-items-center mb-2">
                                    <span class="text-sm text-gray-600 dark:text-gray-400">등록:</span>
                                    <span class="font-bold">&ensp;{{ statistics.konacardStats?.registered || 0 }}명 / {{ statistics.total || 0 }}명</span>
                                </div>
                                <ProgressBar :value="statistics.total > 0 ? Math.round((statistics.konacardStats?.registered / statistics.total) * 100) : 0" :showValue="true" />
                            </div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">미등록: {{ statistics.konacardStats?.notRegistered || 0 }}명</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 3. 법인별 조합원 수 + 법인별 코나카드 등록률 -->
            <div class="grid grid-cols-12 gap-6 mb-6">
                <!-- 법인별 조합원 수 -->
                <div class="col-span-12 lg:col-span-6">
                    <div class="card" style="height: 700px; display: flex; flex-direction: column">
                        <div class="font-semibold text-xl mb-4">법인별 조합원 수 (상위 15개)</div>
                        <div style="flex: 1; overflow-x: auto; overflow-y: hidden">
                            <div style="min-width: 600px; height: 100%">
                                <Chart v-if="corpChartData" type="bar" :data="corpChartData" :options="barChartOptions" style="height: 100%" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 법인별 코나카드 등록률 -->
                <div class="col-span-12 lg:col-span-6">
                    <div class="card" style="height: 700px; display: flex; flex-direction: column">
                        <div class="font-semibold text-xl mb-4">법인별 코나카드 등록률 (상위 15개)</div>
                        <div style="flex: 1; overflow-x: auto; overflow-y: hidden">
                            <div style="min-width: 600px; height: 100%">
                                <Chart v-if="konacardByCorpChartData" type="bar" :data="konacardByCorpChartData" :options="stackedBarChartOptions" style="height: 100%" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 4. 체크오프 대상 분포 + 조합원방 참여율 -->
            <div class="grid grid-cols-12 gap-6 mb-6">
                <!-- 체크오프 대상 분포 -->
                <div class="col-span-12 lg:col-span-6">
                    <div class="card" style="height: 550px; display: flex; flex-direction: column">
                        <div class="font-semibold text-xl mb-4">체크오프 대상 분포</div>
                        <div style="flex: 1; display: flex; align-items: center; justify-content: center">
                            <Chart v-if="checkoffChartData" type="doughnut" :data="checkoffChartData" :options="doughnutChartOptions" style="width: 100%; height: 100%" />
                        </div>
                    </div>
                </div>

                <!-- 조합원방 참여율 -->
                <div class="col-span-12 lg:col-span-6">
                    <div class="card" style="height: 550px; display: flex; flex-direction: column">
                        <div class="font-semibold text-xl mb-4">조합원방 참여율</div>
                        <div style="flex: 1; display: flex; align-items: center; justify-content: center">
                            <Chart v-if="chatRoomChartData" type="doughnut" :data="chatRoomChartData" :options="doughnutChartOptions" style="width: 100%; height: 100%" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- 5. 가입월별 분포 (전체 너비) -->
            <div class="grid grid-cols-12 gap-6">
                <div class="col-span-12">
                    <div class="card" style="height: 550px; display: flex; flex-direction: column">
                        <div class="font-semibold text-xl mb-4">가입월별 분포</div>
                        <div style="flex: 1">
                            <Chart v-if="joinMonthChartData" type="line" :data="joinMonthChartData" :options="lineChartOptions" style="height: 100%" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 데이터 없음 -->
        <div v-else class="text-center p-8">
            <i class="pi pi-users text-6xl text-gray-400 mb-4"></i>
            <p class="text-gray-600 dark:text-gray-400">조합원 통계를 불러올 수 없습니다.</p>
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
</style>
