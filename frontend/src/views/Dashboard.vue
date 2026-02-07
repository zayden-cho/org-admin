<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

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
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
        <ProgressSpinner />
    </div>

    <div v-else class="grid grid-cols-12 gap-8">
        <StatsWidget :stats="stats" />

        <div class="col-span-12">
            <CalendarWidget :events="calendarEvents" />
        </div>

        <div class="col-span-12 xl:col-span-6">
            <CorpDistributionWidget :corp-stats="corpStats" />
        </div>

        <div class="col-span-12 xl:col-span-6">
            <CorpStatsWidget
                :corp-stats="corpStats"
                :total-krews="stats.totalKrews"
            />
        </div>
    </div>
</template>
