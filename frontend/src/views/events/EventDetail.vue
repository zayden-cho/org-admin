<script setup>
import { ref, computed, watch, onMounted } from 'vue';

import { useToast } from 'primevue/usetoast';

import { EventsService } from '@/service/EventsService';
import { KrewsService } from '@/service/KrewsService';

const props = defineProps({
    event: {
        type: Object,
        default: null
    },
    schedule: {
        type: Object,
        default: null
    },
    visible: {
        type: Boolean,
        required: true
    }
});

const emit = defineEmits(['close']);

// 상태
const applications = ref([]);
const applicationsLoading = ref(false);
const krews = ref([]);
const krewsLoading = ref(false);

// Dialog visible 컴퓨티드
const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => {
        if (!value) {
            emit('close');
        }
    }
});

// 조합원 정보가 포함된 참가자 목록
const enrichedApplications = computed(() => {
    return applications.value.map((app) => {
        const krew = krews.value.find((k) => k.krewunionId === app.krewId);
        return {
            ...app,
            name: krew?.name || '-',
            corp: krew?.corp || '-',
            ldap: krew?.ldap || '-'
        };
    });
});

/**
 * 조합원 목록 조회
 */
const loadKrews = async () => {
    try {
        krewsLoading.value = true;
        const response = await KrewsService.getKrews();

        if (response.data.success) {
            krews.value = response.data.data || [];
        }
    } catch (error) {
        console.error('Failed to load krews:', error);
        krews.value = [];
    } finally {
        krewsLoading.value = false;
    }
};

/**
 * 참가 신청 목록 조회
 */
const loadApplications = async () => {
    if (!props.event || !props.schedule) return;

    try {
        applicationsLoading.value = true;

        const year = new Date().getFullYear().toString();
        const response = await EventsService.getEventApplications(props.event.eventId, year);

        if (response.data.success) {
            // 선택된 일정의 신청만 필터링
            applications.value = (response.data.data || []).filter((app) => app.scheduleId === props.schedule.scheduleId);
        } else {
            throw new Error(response.data.error || '참가 신청 조회 실패');
        }
    } catch (error) {
        console.error('Failed to load applications:', error);
        applications.value = [];
    } finally {
        applicationsLoading.value = false;
    }
};

/**
 * 참가 상태 태그 색상
 */
const getApplicationStatusSeverity = (status) => {
    const severityMap = {
        신청: 'success',
        취소: 'danger',
        참석: 'info',
        불참: 'warning'
    };
    return severityMap[status] || 'secondary';
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

/**
 * schedule prop 변경 감지
 */
watch(
    () => props.schedule,
    (newSchedule) => {
        if (newSchedule) {
            loadApplications();
        } else {
            applications.value = [];
        }
    },
    { immediate: true }
);

/**
 * 초기 로드
 */
onMounted(() => {
    loadKrews();
});
</script>

<template>
    <Dialog v-model:visible="dialogVisible" :style="{ width: '1000px' }" :modal="true" class="event-detail-dialog">
        <template #header>
            <div v-if="event && schedule" class="flex align-items-center gap-2">
                <div class="font-semibold text-xl" style="line-height: 1; margin: 0">{{ event.name }} - 참여명단</div>
                <Tag :value="formatDate(schedule.eventDate)" severity="info" size="small" />
                <Tag :value="`${applications.length}명`" severity="success" size="small" />
            </div>
        </template>

        <div v-if="event && schedule" class="detail-content">
            <!-- 일정 정보 -->
            <div class="schedule-info mb-4 p-3">
                <table style="width: 100%; border-collapse: collapse">
                    <tr>
                        <!-- 장소 (왼쪽, 넓게) -->
                        <td style="width: 66%; padding: 0.5rem; vertical-align: top">
                            <label class="text-500 text-sm mb-2 block" style="font-weight: 600; border-bottom: 1px solid #ddd; padding-bottom: 0.25rem">장소</label>
                            <div class="font-semibold mt-2">
                                <i class="pi pi-map-marker mr-1 text-xs text-500"></i>
                                {{ schedule.location }}
                            </div>
                        </td>
                        <!-- 상태 (오른쪽, 좁게) -->
                        <td style="width: 34%; padding: 0.5rem; vertical-align: top">
                            <label class="text-500 text-sm mb-2 block" style="font-weight: 600; border-bottom: 1px solid #ddd; padding-bottom: 0.25rem">상태</label>
                            <div class="mt-2">
                                <Tag :value="schedule.status" :severity="getScheduleStatusSeverity(schedule.status)" />
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <!-- 신청 기간 (왼쪽, 넓게) -->
                        <td style="width: 66%; padding: 0.5rem; padding-top: 1rem; vertical-align: top">
                            <label class="text-500 text-sm mb-2 block" style="font-weight: 600; border-bottom: 1px solid #ddd; padding-bottom: 0.25rem">신청 기간</label>
                            <div class="text-600 mt-2">{{ formatDate(schedule.registrationStartDate) }} ~ {{ formatDate(schedule.registrationEndDate) }}</div>
                        </td>
                        <!-- 정원/신청자 (오른쪽, 좁게) -->
                        <td style="width: 34%; padding: 0.5rem; padding-top: 1rem; vertical-align: top">
                            <label class="text-500 text-sm mb-2 block" style="font-weight: 600; border-bottom: 1px solid #ddd; padding-bottom: 0.25rem">정원 / 신청자</label>
                            <div class="font-semibold mt-2">
                                {{ schedule.capacity }}명 /
                                <span :class="schedule.applicantCount >= schedule.capacity ? 'text-red-500' : 'text-primary'"> {{ schedule.applicantCount }}명 </span>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>

            <Divider />

            <!-- 참여 명단 -->
            <div>
                <div class="font-semibold text-lg text-700" style="line-height: 1; margin-top: 2rem; margin-bottom: 1rem">참여자 목록</div>

                <div v-if="applicationsLoading" class="text-center p-4">
                    <ProgressSpinner style="width: 50px; height: 50px" />
                </div>

                <div v-else-if="applications.length === 0" class="text-center p-4">
                    <i class="pi pi-users text-4xl text-400 mb-3"></i>
                    <p class="text-600">참여 신청이 없습니다</p>
                </div>

                <div v-else>
                    <DataTable :value="enrichedApplications" stripedRows showGridlines responsiveLayout="scroll" :paginator="true" :rows="10" class="participants-table">
                        <Column field="corp" header="법인" style="min-width: 150px">
                            <template #body="{ data }">
                                <span class="text-600">{{ data.corp }}</span>
                            </template>
                        </Column>

                        <Column field="name" header="이름" style="min-width: 100px">
                            <template #body="{ data }">
                                <span class="font-semibold">{{ data.name }}</span>
                            </template>
                        </Column>

                        <Column field="ldap" header="영문명" style="min-width: 150px">
                            <template #body="{ data }">
                                <span class="text-600">{{ data.ldap }}</span>
                            </template>
                        </Column>

                        <Column field="month" header="월" style="min-width: 60px">
                            <template #body="{ data }"> {{ data.month }}월 </template>
                        </Column>

                        <Column field="status" header="상태" style="min-width: 80px">
                            <template #body="{ data }">
                                <Tag :value="data.status" :severity="getApplicationStatusSeverity(data.status)" />
                            </template>
                        </Column>

                        <Column field="applicationDate" header="신청일" style="min-width: 100px">
                            <template #body="{ data }">
                                {{ formatDate(data.applicationDate) }}
                            </template>
                        </Column>

                        <Column field="notes" header="메모" style="min-width: 150px">
                            <template #body="{ data }">
                                <span class="text-600 text-sm">{{ data.notes || '-' }}</span>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </div>
    </Dialog>
</template>

<style scoped>
.detail-content {
    max-height: 70vh;
    overflow-y: auto;
}

.schedule-info {
    background: var(--surface-50);
    border-radius: 6px;
}

/* DataTable 스타일 */
:deep(.participants-table .p-datatable-tbody > tr > td) {
    padding: 0.5rem;
    font-size: 0.875rem;
}

:deep(.participants-table .p-datatable-thead > tr > th) {
    padding: 0.5rem;
    background: var(--surface-50);
    font-weight: 600;
    font-size: 0.875rem;
}

:deep(.participants-table .p-paginator) {
    padding: 0.5rem;
}
</style>
