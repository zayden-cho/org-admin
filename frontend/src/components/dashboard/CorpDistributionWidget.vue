<script setup>
import { useLayout } from '@/layout/composables/layout';
import { onMounted, ref, watch } from 'vue';

const { layoutConfig, isDarkTheme } = useLayout();

const props = defineProps({
    corpStats: {
        type: Array,
        required: true
    }
});

const chartData = ref(null);
const chartOptions = ref(null);

const corpColorMap = {
    '그립컴퍼니': '#84CC16',              // 라임
    '디케이테크인': '#F87171',      // 라이트 레드
    '링키지랩': '#10B981',          // 에메랄드
    '볼트업': '#8B5CF6',            // 바이올렛
    '서울아레나': '#D946EF',        // 푸시아
    '에이엑스지': '#F59E0B',        // 앰버
    '엑스엘게임즈': '#64748B',      // 슬레이트
    '카카오': '#FFCC00',           // 카카오 옐로우
    '카카오게임즈': '#9333EA',      // 퍼플
    '카카오모빌리티': '#6366F1',    // 인디고
    '카카오뱅크': '#EAB308',        // 다크 옐로우
    '카카오스타일': '#EC4899',      // 핑크
    '카카오엔터테인먼트': '#EF4444', // 레드
    '카카오엔터프라이즈': '#2563EB', // 다크 블루
    '카카오임팩트': '#22C55E',      // 그린
    '카카오페이': '#F97316',        // 오렌지
    '카카오페이증권': '#06B6D4',    // 시안
    '카카오헬스케어': '#14B8A6',    // 틸
    '카카오VX': '#3366FF',         // 블루
    '케이드라이브': '#6B7280',      // 그레이
    '케이앤웍스': '#737373',        // 뉴트럴
    '케이엠파크': '#0EA5E9',        // 스카이
    '키이스트': '#71717A',           // 징크
    'SM엔터테인먼트': '#F43F5E',    // 로즈
};

function getCorpColor(corpName) {
    return corpColorMap[corpName] || '#95A5A6';
}

function setChartData() {
    const labels = props.corpStats.map(stat => stat.corp);
    const data = props.corpStats.map(stat => stat.count);
    const colors = labels.map(label => getCorpColor(label));

    return {
        labels: labels,
        datasets: [
            {
                label: '조합원 수',
                backgroundColor: colors,
                data: data,
                borderRadius: 8,
                barThickness: 32,
                categoryPercentage: 0.7,
                barPercentage: 0.8,
            }
        ]
    };
}

function setChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const borderColor = documentStyle.getPropertyValue('--surface-border');
    const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        responsive: true,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: documentStyle.getPropertyValue('--surface-card'),
                titleColor: documentStyle.getPropertyValue('--text-color'),
                bodyColor: documentStyle.getPropertyValue('--text-color'),
                borderColor: borderColor,
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                callbacks: {
                    title: function(context) {
                        return context[0].label;
                    },
                    label: function(context) {
                        return context.parsed.y.toLocaleString() + '명';
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textMutedColor,
                    font: {
                        size: 11
                    },
                    maxRotation: 45,
                    minRotation: 45
                },
                grid: {
                    color: 'transparent',
                    borderColor: 'transparent'
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: textMutedColor,
                    font: {
                        size: 12
                    },
                    callback: function(value) {
                        return value.toLocaleString();
                    }
                },
                grid: {
                    color: borderColor,
                    borderColor: 'transparent',
                    drawTicks: false
                }
            }
        },
        animation: {
            duration: 750,
            easing: 'easeInOutQuart'
        }
    };
}

watch([() => layoutConfig.primary, () => layoutConfig.surface, isDarkTheme, () => props.corpStats], () => {
    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
}, { deep: true });

onMounted(() => {
    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
});
</script>

<template>
    <div class="card h-full">
        <div class="font-semibold text-xl mb-4">법인별 조합원 분포</div>

        <!-- 스크롤 가능한 컨테이너 -->
        <div class="chart-scroll-container">
            <div class="chart-scroll-content" :style="{ width: `${corpStats.length * 60}px` }">
                <Chart type="bar" :data="chartData" :options="chartOptions" class="h-80" />
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 가로 스크롤 컨테이너 */
.chart-scroll-container {
    overflow-x: auto;
    overflow-y: hidden;
    width: 100%;
    padding-bottom: 1rem;
}

.chart-scroll-content {
    min-width: 100%;
    height: 350px;
}

/* 스크롤바 스타일링 */
.chart-scroll-container::-webkit-scrollbar {
    height: 8px;
}

.chart-scroll-container::-webkit-scrollbar-track {
    background: var(--surface-100);
    border-radius: 4px;
}

.chart-scroll-container::-webkit-scrollbar-thumb {
    background: var(--surface-400);
    border-radius: 4px;
}

.chart-scroll-container::-webkit-scrollbar-thumb:hover {
    background: var(--surface-500);
}
</style>
