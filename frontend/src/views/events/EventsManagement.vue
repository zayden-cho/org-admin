<script setup>
import { ref, onMounted } from 'vue';

import { useToast } from 'primevue/usetoast';

import { EventsService } from '@/service/EventsService';
import EventDetail from '@/views/events/EventDetail.vue';

const toast = useToast();

// 상태
const events = ref([]);
const schedules = ref([]);
const loading = ref(false);
const schedulesLoading = ref(false);
const selectedEvent = ref(null);
const selectedSchedule = ref(null);
const detailDialogVisible = ref(false);

/**
 * 행사 목록 조회
 */
const loadEvents = async (forceRefresh = false) => {
    try {
        loading.value = true;
        const response = await EventsService.getEvents(forceRefresh);

        if (response.data.success) {
            events.value = response.data.data || [];

            // 첫 번째 행사 자동 선택
            if (events.value.length > 0 && !selectedEvent.value) {
                selectEvent(events.value[0]);
            }

            if (forceRefresh) {
                toast.add({
                    severity: 'success',
                    summary: '새로고침 완료',
                    detail: `${events.value.length}개 행사 로드됨`,
                    life: 3000
                });
            }
        } else {
            throw new Error(response.data.error || '행사 목록 조회 실패');
        }
    } catch (error) {
        console.error('Failed to load events:', error);
        toast.add({
            severity: 'error',
            summary: '오류',
            detail: '행사 목록을 불러올 수 없습니다.',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

/**
 * 행사 선택
 */
const selectEvent = async (event) => {
    selectedEvent.value = event;
    await loadSchedules(event.eventId);
};

/**
 * 행사 일정 조회
 */
const loadSchedules = async (eventId) => {
    try {
        schedulesLoading.value = true;
        const response = await EventsService.getEventSchedules(eventId);

        if (response.data.success) {
            schedules.value = response.data.data || [];
        } else {
            throw new Error(response.data.error || '일정 조회 실패');
        }
    } catch (error) {
        console.error('Failed to load schedules:', error);
        toast.add({
            severity: 'error',
            summary: '오류',
            detail: '행사 일정을 불러올 수 없습니다.',
            life: 3000
        });
        schedules.value = [];
    } finally {
        schedulesLoading.value = false;
    }
};

/**
 * 참여명단 보기
 */
const showDetail = (schedule) => {
    selectedSchedule.value = schedule;
    detailDialogVisible.value = true;
};

/**
 * Dialog 닫기
 */
const closeDetailDialog = () => {
    detailDialogVisible.value = false;
    selectedSchedule.value = null;
};

/**
 * 새로고침
 */
const refresh = () => {
    loadEvents(true);
};

/**
 * 일정 상태 태그 색상
 */
const getScheduleStatusSeverity = (status) => {
    const severityMap = {
        예정: 'secondary',
        모집중: 'success',
        모집마감: 'warning',
        진행완료: 'info',
        취소: 'danger'
    };
    return severityMap[status] || 'secondary';
};

/**
 * 날짜 포맷
 */
const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
};

// 초기 로드
onMounted(() => {
    loadEvents();
});
</script>

<template>
    <div class="card">
        <!-- 헤더 -->
        <div class="flex align-items-center gap-3 mb-4" style="align-items: center">
            <div class="font-semibold text-xl" style="line-height: 1; margin: 0">Filtering</div>
            <Button label="Refresh" icon="pi pi-refresh" severity="success" size="small" text @click="refresh" :loading="loading" />
        </div>

        <!-- 행사 버튼 목록 -->
        <div class="mb-4">
            <label class="block text-700 font-medium mb-2">행사</label>
            <div class="flex flex-wrap gap-2">
                <Button
                    v-for="event in events"
                    :key="event.eventId"
                    :label="event.이름"
                    :outlined="selectedEvent?.eventId !== event.eventId"
                    :severity="selectedEvent?.eventId === event.eventId ? 'primary' : 'secondary'"
                    size="small"
                    @click="selectEvent(event)"
                >
                    <template #default>
                        <span class="font-medium">{{ event.이름 }}</span>
                        <Tag :value="event.유형" size="small" :severity="event.유형 === '정기' ? 'success' : 'info'" class="ml-2" />
                    </template>
                </Button>
            </div>
        </div>

        <!-- 일정 목록 -->
        <div v-if="selectedEvent">
            <div class="flex align-items-center gap-2 mb-3" style="align-items: center">
                <div class="font-semibold text-lg text-700" style="line-height: 1; margin-top: 1.5rem; margin-bottom: 1rem">{{ selectedEvent.이름 }} - 전체 일정</div>
                <Tag :value="`${schedules.length}개`" severity="info" />
            </div>

            <DataTable :value="schedules" :loading="schedulesLoading" stripedRows showGridlines responsiveLayout="scroll" dataKey="scheduleId" :paginator="true" :rows="10" class="schedules-table">
                <template #empty>
                    <div class="text-center p-4">
                        <i class="pi pi-calendar-times text-4xl text-400 mb-3"></i>
                        <p class="text-600">등록된 일정이 없습니다</p>
                    </div>
                </template>

                <Column field="scheduleId" header="일정 ID" style="width: 110px">
                    <template #body="{ data }">
                        <span class="text-xs text-500">{{ data.scheduleId }}</span>
                    </template>
                </Column>

                <Column field="행사일" header="행사일" :sortable="true" style="width: 110px">
                    <template #body="{ data }">
                        <span class="font-semibold">{{ formatDate(data.행사일) }}</span>
                    </template>
                </Column>

                <Column field="장소" header="장소" style="width: 220px">
                    <template #body="{ data }">
                        <div class="text-600">
                            <i class="pi pi-map-marker mr-1 text-xs text-500"></i>
                            {{ data.장소 }}
                        </div>
                    </template>
                </Column>

                <Column header="신청 기간" style="width: 220px">
                    <template #body="{ data }">
                        <div class="text-xs text-600">
                            {{ formatDate(data.참가_신청_시작일) }}
                            <br />
                            ~ {{ formatDate(data.참가_신청_마감일) }}
                        </div>
                    </template>
                </Column>

                <Column header="정원" style="width: 70px">
                    <template #body="{ data }">
                        <span class="font-semibold">{{ data.정원 }}명</span>
                    </template>
                </Column>

                <Column header="신청자" style="width: 90px">
                    <template #body="{ data }">
                        <div class="flex align-items-center gap-1">
                            <i class="pi pi-users text-xs text-500"></i>
                            <span class="font-semibold" :class="data.신청자_수 >= data.정원 ? 'text-red-500' : 'text-primary'"> {{ data.신청자_수 }}명 </span>
                        </div>
                    </template>
                </Column>

                <Column header="모집률" style="width: 100px">
                    <template #body="{ data }">
                        <div>
                            <div class="text-xs text-500 mb-1">{{ Math.round((data.신청자_수 / data.정원) * 100) }}%</div>
                            <div class="w-full bg-gray-200 border-round" style="height: 4px">
                                <div class="bg-primary border-round" style="height: 4px" :style="{ width: `${Math.min((data.신청자_수 / data.정원) * 100, 100)}%` }"></div>
                            </div>
                        </div>
                    </template>
                </Column>

                <Column field="상태" header="상태" style="width: 90px">
                    <template #body="{ data }">
                        <Tag :value="data.상태" :severity="getScheduleStatusSeverity(data.상태)" />
                    </template>
                </Column>

                <Column style="width: 100px">
                    <template #body="{ data }">
                        <Button label="참여명단" icon="pi pi-users" size="small" outlined @click="showDetail(data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- 행사 상세 Dialog -->
        <EventDetail :event="selectedEvent" :schedule="selectedSchedule" :visible="detailDialogVisible" @close="closeDetailDialog" />
    </div>
</template>

<style scoped>
/* DataTable 스타일 */
:deep(.schedules-table .p-datatable-tbody > tr > td) {
    padding: 0.6rem;
    font-size: 0.875rem;
}

:deep(.schedules-table .p-datatable-thead > tr > th) {
    padding: 0.6rem;
    background: var(--surface-50);
    font-weight: 600;
    font-size: 0.875rem;
}

:deep(.schedules-table .p-paginator) {
    padding: 0.5rem;
}
</style>
