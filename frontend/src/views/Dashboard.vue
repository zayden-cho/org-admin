<script setup>
import { ref, computed, onMounted } from 'vue';

import { CalendarService } from '@/service/CalendarService';
import { KrewsService } from '@/service/KrewsService';
import StatsWidget from '@/components/dashboard/StatsWidget.vue';
import CalendarWidget from '@/components/dashboard/CalendarWidget.vue';
import CorpDistributionWidget from '@/components/dashboard/CorpDistributionWidget.vue';
import CorpStatsWidget from '@/components/dashboard/CorpStatsWidget.vue';

const loading = ref(true);
const krews = ref([]);
const calendarEvents = ref([]);

const stats = computed(() => {
    if (!krews.value.length) return {
        totalKrews: 0,
        newKrews: 0,
        totalCorps: 0,
        corpNames: [],
        registeredKonacards: 0,
        konacardRate: 0,
        activeStatus: 0,
        activeRate: 0
    };

    const total = krews.value.length;
    const uniqueCorps = [...new Set(krews.value.map(k => k.corp))];
    const withKonacard = krews.value.filter(k => k.konacard && k.konacard.trim() !== '').length;
    const activeCount = krews.value.filter(k => k.status === '등록성공').length;
    const newCount = 24;

    return {
        totalKrews: total,
        newKrews: newCount,
        totalCorps: uniqueCorps.length,
        corpNames: uniqueCorps.sort(),
        registeredKonacards: withKonacard,
        konacardRate: total > 0 ? Math.round((withKonacard / total) * 100) : 0,
        activeStatus: activeCount,
        activeRate: total > 0 ? Math.round((activeCount / total) * 100) : 0
    };
});

const corpStats = computed(() => {
    if (!krews.value.length) return [];

    const corpMap = new Map();
    krews.value.forEach(krew => {
        const count = corpMap.get(krew.corp) || 0;
        corpMap.set(krew.corp, count + 1);
    });

    return Array.from(corpMap.entries())
        .map(([corp, count]) => ({ corp, count }))
        .sort((a, b) => b.count - a.count);
});

onMounted(async () => {
    await loadData();
});

async function loadData() {
    try {
        loading.value = true;

        const krewsResponse = await KrewsService.getKrews();
        krews.value = krewsResponse.data.data || [];

        try {
            const calendarResponse = await CalendarService.getEvents();
            calendarEvents.value = calendarResponse.data.data || [];
        } catch (error) {
            console.error('캘린더 로드 실패:', error);
        }

        console.log('Dashboard loaded');
    } catch (error) {
        console.error('Dashboard load error:', error);
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- ✅ 로딩 중에도 레이아웃 표시! -->

        <!-- 통계 위젯 스켈레톤 -->
        <div v-if="loading" class="col-span-12">
            <div class="grid grid-cols-12 gap-6">
                <div v-for="i in 4" :key="i" class="col-span-12 md:col-span-6 xl:col-span-3">
                    <div class="card">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <Skeleton width="8rem" height="1.5rem" class="mb-2"></Skeleton>
                                <Skeleton width="6rem" height="2.5rem"></Skeleton>
                            </div>
                            <Skeleton shape="circle" size="3rem"></Skeleton>
                        </div>
                        <Skeleton width="10rem" height="1rem"></Skeleton>
                    </div>
                </div>
            </div>
        </div>
        <StatsWidget v-else :stats="stats" />

        <!-- 캘린더 위젯 -->
        <div class="col-span-12">
            <div v-if="loading" class="card">
                <div class="font-semibold text-xl mb-4">
                    <Skeleton width="10rem" height="1.5rem"></Skeleton>
                </div>
                <Skeleton width="100%" height="500px"></Skeleton>
            </div>
            <CalendarWidget v-else :events="calendarEvents" />
        </div>

        <!-- 법인 분포 차트 스켈레톤 -->
        <div class="col-span-12 xl:col-span-6">
            <div v-if="loading" class="card">
                <div class="font-semibold text-xl mb-4">
                    <Skeleton width="10rem" height="1.5rem"></Skeleton>
                </div>
                <Skeleton width="100%" height="400px"></Skeleton>
            </div>
            <CorpDistributionWidget v-else :corp-stats="corpStats" />
        </div>

        <!-- 법인 통계 테이블 스켈레톤 -->
        <div class="col-span-12 xl:col-span-6">
            <div v-if="loading" class="card">
                <div class="font-semibold text-xl mb-4">
                    <Skeleton width="10rem" height="1.5rem"></Skeleton>
                </div>
                <div class="flex flex-col gap-3">
                    <Skeleton v-for="i in 8" :key="i" width="100%" height="3rem"></Skeleton>
                </div>
            </div>
            <CorpStatsWidget
                v-else
                :corp-stats="corpStats"
                :total-krews="stats.totalKrews"
            />
        </div>
    </div>
</template>
