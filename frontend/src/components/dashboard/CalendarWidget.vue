<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const router = useRouter();

const props = defineProps({
    events: {
        type: Array,
        default: () => []
    }
});

const calendarOptions = ref({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,dayGridWeek'
    },
    editable: false,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    locale: 'ko',
    buttonText: {
        today: '오늘',
        month: '월',
        week: '주'
    },
    events: [],
    eventClick: handleEventClick,
    height: 600
});

const weekEventsDialog = ref(false);
const weekEventsTitle = ref('');
const weekEventsList = ref([]);

watch(() => props.events, (newEvents) => {
    calendarOptions.value.events = newEvents;
}, { immediate: true, deep: true });

function handleEventClick(clickInfo) {
    const event = clickInfo.event;
    console.log('Event clicked:', event.title, event.extendedProps);

    if (event.extendedProps.type === 'krew') {
        router.push(`/krews?id=${event.extendedProps.krewId}`);
    }
}

onMounted(() => {
    calendarOptions.value.events = props.events;
});

const thisWeekEvents = computed(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return props.events.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate >= startOfWeek && eventDate <= endOfWeek;
    });
});

const nextWeekEvents = computed(() => {
    const now = new Date();
    const startOfNextWeek = new Date(now);
    startOfNextWeek.setDate(now.getDate() - now.getDay() + 7);
    startOfNextWeek.setHours(0, 0, 0, 0);

    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
    endOfNextWeek.setHours(23, 59, 59, 999);

    return props.events.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate >= startOfNextWeek && eventDate <= endOfNextWeek;
    });
});

function showMoreEvents(type) {
    if (type === 'thisWeek') {
        weekEventsTitle.value = '금주 일정';
        weekEventsList.value = thisWeekEvents.value;
    } else {
        weekEventsTitle.value = '차주 일정';
        weekEventsList.value = nextWeekEvents.value;
    }
    weekEventsDialog.value = true;
}
</script>

<template>
    <div class="card">
        <!-- 상단: 금주/차주 일정 + 범례 -->
        <div class="flex justify-between items-start mb-4 pb-4 border-b border-surface">
            <!-- 좌측: 금주/차주 일정 -->
            <div class="flex gap-6">
                <div>
                    <div class="text-xs text-muted-color font-semibold mb-2">금주 일정</div>
                    <div class="flex flex-col gap-1">
                        <div
                            v-if="thisWeekEvents.length === 0"
                            class="text-sm text-muted-color"
                        >
                            일정 없음
                        </div>
                        <div
                            v-for="event in thisWeekEvents.slice(0, 3)"
                            :key="event.id"
                            class="text-sm flex items-center gap-2"
                        >
                            <div
                                class="w-2 h-2 rounded-full flex-shrink-0"
                                :style="{ backgroundColor: event.backgroundColor }"
                            ></div>
                            <span class="truncate">{{ event.title }}</span>
                        </div>
                        <button
                            v-if="thisWeekEvents.length > 3"
                            @click="showMoreEvents('thisWeek')"
                            class="text-xs text-primary cursor-pointer hover:underline text-left"
                        >
                            +{{ thisWeekEvents.length - 3 }}개 더보기
                        </button>
                    </div>
                </div>

                <div>
                    <div class="text-xs text-muted-color font-semibold mb-2">차주 일정</div>
                    <div class="flex flex-col gap-1">
                        <div
                            v-if="nextWeekEvents.length === 0"
                            class="text-sm text-muted-color"
                        >
                            일정 없음
                        </div>
                        <div
                            v-for="event in nextWeekEvents.slice(0, 3)"
                            :key="event.id"
                            class="text-sm flex items-center gap-2"
                        >
                            <div
                                class="w-2 h-2 rounded-full flex-shrink-0"
                                :style="{ backgroundColor: event.backgroundColor }"
                            ></div>
                            <span class="truncate">{{ event.title }}</span>
                        </div>
                        <button
                            v-if="nextWeekEvents.length > 3"
                            @click="showMoreEvents('nextWeek')"
                            class="text-xs text-primary cursor-pointer hover:underline text-left"
                        >
                            +{{ nextWeekEvents.length - 3 }}개 더보기
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 캘린더 -->
        <FullCalendar :options="calendarOptions" class="calendar-custom" />

        <!-- 주간 일정 전체보기 다이얼로그 -->
        <Dialog
            v-model:visible="weekEventsDialog"
            :style="{ width: '500px' }"
            :header="weekEventsTitle"
            :modal="true"
        >
            <div class="flex flex-col gap-3">
                <div
                    v-for="event in weekEventsList"
                    :key="event.id"
                    class="flex items-center gap-3 p-3 border border-surface rounded-lg hover:bg-surface-50 transition-colors"
                >
                    <div
                        class="w-4 h-4 rounded-full flex-shrink-0"
                        :style="{ backgroundColor: event.backgroundColor }"
                    ></div>
                    <div class="flex-1">
                        <div class="font-medium">{{ event.title }}</div>
                        <div class="text-sm text-muted-color">
                            {{ new Date(event.start).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }) }}
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button
                    label="닫기"
                    icon="pi pi-times"
                    text
                    @click="weekEventsDialog = false"
                />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
/* ========================================
   FullCalendar 기본 스타일
   ======================================== */
:deep(.fc) {
    font-family: inherit;
}

/* ========================================
   버튼 스타일 (PrimeVue 시맨틱 변수 사용)
   ======================================== */
:deep(.fc .fc-button-primary) {
    background-color: var(--p-primary-color) !important;
    border-color: var(--p-primary-color) !important;
    color: var(--p-primary-contrast-color) !important;
    text-transform: none;
    font-weight: 600;
    transition: all 0.2s ease;
}

:deep(.fc .fc-button-primary:hover) {
    background-color: var(--p-primary-hover-color) !important;
    border-color: var(--p-primary-hover-color) !important;
    color: var(--p-primary-contrast-color) !important;
    transform: translateY(-1px);
}

:deep(.fc .fc-button-primary:disabled) {
    background-color: var(--p-primary-color) !important;
    border-color: var(--p-primary-color) !important;
    color: var(--p-primary-contrast-color) !important;
    opacity: 0.6;
}

:deep(.fc .fc-button-primary:not(:disabled):active),
:deep(.fc .fc-button-primary:not(:disabled).fc-button-active) {
    background-color: var(--p-primary-active-color) !important;
    border-color: var(--p-primary-active-color) !important;
    color: var(--p-primary-contrast-color) !important;
    font-weight: 700;
}

/* ========================================
   오늘 날짜 강조 (시맨틱 변수 사용)
   ======================================== */
:deep(.fc-day-today) {
    background-color: var(--p-highlight-background) !important;
}

:deep(.fc-day-today .fc-daygrid-day-number) {
    background-color: var(--p-primary-color);
    color: var(--p-primary-contrast-color);
    font-weight: 700;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    white-space: nowrap;
}

/* ========================================
   타이틀 & 이벤트
   ======================================== */
:deep(.fc-toolbar-title) {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
}

:deep(.fc-event) {
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
}

:deep(.fc-event:hover) {
    transform: scale(1.05);
    z-index: 10;
    filter: brightness(1.15);
}

:deep(.fc-daygrid-event) {
    margin: 2px 4px;
    padding: 2px 4px;
}

:deep(.fc-event-title) {
    font-weight: 500;
    font-size: 0.875rem;
}

/* ========================================
   헤더 & 날짜 셀
   ======================================== */
:deep(.fc-col-header-cell) {
    background-color: var(--surface-ground);
    color: var(--text-color);
    font-weight: 600;
    padding: 8px 4px;
    border-color: var(--surface-border);
}

:deep(.fc-daygrid-day) {
    transition: background-color 0.2s ease;
}

:deep(.fc-daygrid-day:hover) {
    background-color: var(--p-highlight-background);
}

:deep(.fc-daygrid-day-number) {
    color: var(--text-color);
    padding: 4px;
    font-weight: 500;
}

/* ========================================
   격자선
   ======================================== */
:deep(.fc-theme-standard td),
:deep(.fc-theme-standard th) {
    border-color: var(--surface-border);
}

:deep(.fc-scrollgrid) {
    border-color: var(--surface-border) !important;
}
</style>
