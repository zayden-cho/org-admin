<script setup>
import { ref, onMounted, computed, watch } from 'vue';

import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';

import { KrewsService } from '@/service/KrewsService';
import KrewDetail from '@/views/krews/KrewDetail.vue';

const toast = useToast();
const dt = ref();
const krews = ref([]);
const krewDialog = ref(false);
const selectedKrew = ref({});
const selectedKrews = ref([]);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const loading = ref(false);
const syncing = ref(false);

// 필터 상태
const selectedCorp = ref(null);
const selectedStatus = ref(null);

// 법인별 갱신용 Dialog
const syncCorpDialogVisible = ref(false);
const syncKonacardCorpDialogVisible = ref(false);
const selectedSyncCorp = ref(null);

// 갱신된 조합원 수 저장
const lastSyncCount = ref(null);

// ✅ Sleep 유틸 함수
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// 법인 목록
const corpList = computed(() => {
    const corps = [...new Set(krews.value.map((k) => k.corp))];
    return corps.filter(Boolean).sort();
});

// CMS 상태 목록
const statusList = [
    { label: '등록성공', value: '등록성공' },
    { label: '미등록', value: '미등록' }
];

// 필터링된 데이터
const filteredKrews = computed(() => {
    let result = krews.value.map((k) => ({
        ...k,
        orgChartString: k.orgChart && k.orgChart.length > 0 ? k.orgChart.join(' ') : ''
    }));

    if (selectedCorp.value) {
        result = result.filter((k) => k.corp === selectedCorp.value);
    }

    if (selectedStatus.value) {
        result = result.filter((k) => k.status === selectedStatus.value);
    }

    return result;
});

// ========================================
// 페이지 전환 시 선택 해제
// ========================================
watch(
    () => dt.value?.d_first,
    (newFirst, oldFirst) => {
        if (oldFirst !== undefined && newFirst !== oldFirst) {
            selectedKrews.value = [];
        }
    }
);

// ========================================
// 현재 페이지 데이터 가져오기
// ========================================
function getCurrentPageData() {
    if (!dt.value) return [];

    const first = dt.value.d_first || 0;
    const rows = dt.value.d_rows || 10;

    return filteredKrews.value.slice(first, first + rows);
}

// ========================================
// 현재 페이지 전체 선택 여부 체크
// ========================================
const isAllCurrentPageSelected = computed(() => {
    const currentPageData = getCurrentPageData();

    if (currentPageData.length === 0) return false;

    return currentPageData.every((item) => selectedKrews.value.some((selected) => selected.krewunionId === item.krewunionId));
});

// ========================================
// 현재 페이지 전체 선택/해제 토글
// ========================================
function toggleCurrentPageSelection(checked) {
    const currentPageData = getCurrentPageData();

    if (checked) {
        const newSelections = [...selectedKrews.value];
        let addedCount = 0;

        currentPageData.forEach((item) => {
            if (!newSelections.some((s) => s.krewunionId === item.krewunionId)) {
                newSelections.push(item);
                addedCount++;
            }
        });

        selectedKrews.value = newSelections;

        if (addedCount > 0) {
            toast.add({
                severity: 'info',
                summary: '선택 완료',
                detail: `현재 페이지 ${addedCount}명이 선택되었습니다.`,
                life: 2000
            });
        }
    } else {
        const currentPageIds = currentPageData.map((item) => item.krewunionId);
        const beforeCount = selectedKrews.value.length;

        selectedKrews.value = selectedKrews.value.filter((item) => !currentPageIds.includes(item.krewunionId));

        const removedCount = beforeCount - selectedKrews.value.length;

        if (removedCount > 0) {
            toast.add({
                severity: 'info',
                summary: '선택 해제',
                detail: `현재 페이지 ${removedCount}명이 해제되었습니다.`,
                life: 2000
            });
        }
    }
}

// ========================================
// 개별 행 선택/해제 토글
// ========================================
function toggleRowSelection(rowData) {
    const index = selectedKrews.value.findIndex((item) => item.krewunionId === rowData.krewunionId);

    if (index > -1) {
        selectedKrews.value.splice(index, 1);
    } else {
        selectedKrews.value.push(rowData);
    }
}

// ========================================
// 개별 행 선택 여부 체크
// ========================================
function isRowSelected(rowData) {
    return selectedKrews.value.some((item) => item.krewunionId === rowData.krewunionId);
}

// ========================================
// 전체 선택 해제
// ========================================
function deselectAll() {
    const count = selectedKrews.value.length;
    selectedKrews.value = [];

    if (count > 0) {
        toast.add({
            severity: 'info',
            summary: '선택 해제',
            detail: `${count}명의 선택이 해제되었습니다.`,
            life: 2000
        });
    }
}

// ========================================
// 조합원 데이터 로드
// ========================================
async function loadKrews(forceRefresh = false) {
    loading.value = true;

    try {
        const response = await KrewsService.getKrews(forceRefresh);
        krews.value = response.data.data || [];

        if (response.data.cached) {
            console.log('캐시 사용됨');

            if (!forceRefresh) {
                // 자동 로드 시 캐시 사용 (조용히)
            } else {
                toast.add({
                    severity: 'info',
                    summary: '캐시 데이터',
                    detail: '캐시된 데이터를 사용했습니다.',
                    life: 2000
                });
            }
        } else {
            console.log('새로 가져옴');

            const count = lastSyncCount.value !== null ? lastSyncCount.value : krews.value.length;

            toast.add({
                severity: 'success',
                summary: '최신 데이터',
                detail: `${count}명의 조합원 정보를 새로 불러왔습니다.`,
                life: 3000
            });

            lastSyncCount.value = null;
        }
    } catch (error) {
        console.error('Load error:', error);

        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: '조합원 목록을 불러올 수 없습니다.',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

async function refreshKrews() {
    await loadKrews(true);
}

async function viewKrew(krew) {
    try {
        loading.value = true;

        const response = await KrewsService.getKrewById(krew.krewunionId);

        if (response.data.success) {
            selectedKrew.value = response.data.data; // 법인 시트 상세 정보!
            krewDialog.value = true;
        } else {
            throw new Error(response.data.error || '조합원 정보를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('조합원 상세 조회 실패:', error);
        toast.add({
            severity: 'error',
            summary: '조회 실패',
            detail: '조합원 상세 정보를 불러올 수 없습니다.',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

// ========================================
// 전체 조합원 갱신
// ========================================
async function syncAllKrews() {
    syncing.value = true;

    try {
        toast.add({
            severity: 'info',
            summary: '처리 중',
            detail: '전체 조합원을 갱신하고 있습니다. 잠시만 기다려주세요...',
            life: 5000
        });

        const response = await KrewsService.syncAllKrews();

        if (response.data.count !== undefined) {
            lastSyncCount.value = response.data.count;
        }

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: response.data.message || '전체 조합원 정보가 갱신되었습니다.',
            life: 3000
        });

        // ✅ Rate Limit 회피: 2초 대기 (이중 안전장치)
        console.log('⏳ Rate limit 회피: 2초 대기...');
        await sleep(2000);

        await loadKrews(true);
    } catch (error) {
        console.error('Sync error:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: '전체 조합원 갱신에 실패했습니다.',
            life: 3000
        });
    } finally {
        syncing.value = false;
    }
}

// ========================================
// 법인별 조합원 갱신
// ========================================
function openSyncCorpDialog() {
    selectedSyncCorp.value = null;
    syncCorpDialogVisible.value = true;
}

async function syncCorpKrews() {
    if (!selectedSyncCorp.value) {
        toast.add({
            severity: 'warn',
            summary: '알림',
            detail: '법인을 선택해주세요.',
            life: 3000
        });
        return;
    }

    syncing.value = true;

    try {
        toast.add({
            severity: 'info',
            summary: '처리 중',
            detail: `${selectedSyncCorp.value} 조합원을 갱신하고 있습니다. 잠시만 기다려주세요...`,
            life: 5000
        });

        const response = await KrewsService.syncCorpKrews(selectedSyncCorp.value);

        if (response.data.count !== undefined) {
            lastSyncCount.value = response.data.count;
        }

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: response.data.message || `${selectedSyncCorp.value} 조합원 정보가 갱신되었습니다.`,
            life: 3000
        });

        syncCorpDialogVisible.value = false;

        // ✅ Rate Limit 회피: 2초 대기 (이중 안전장치)
        console.log('⏳ Rate limit 회피: 2초 대기...');
        await sleep(2000);

        await loadKrews(true);
    } catch (error) {
        console.error('Corp sync error:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: `${selectedSyncCorp.value} 조합원 갱신에 실패했습니다.`,
            life: 3000
        });
    } finally {
        syncing.value = false;
    }
}

// ========================================
// 법인별 코나카드 갱신
// ========================================
function openSyncKonacardCorpDialog() {
    selectedSyncCorp.value = null;
    syncKonacardCorpDialogVisible.value = true;
}

async function syncCorpKonacards() {
    if (!selectedSyncCorp.value) {
        toast.add({
            severity: 'warn',
            summary: '알림',
            detail: '법인을 선택해주세요.',
            life: 3000
        });
        return;
    }

    syncing.value = true;

    try {
        toast.add({
            severity: 'info',
            summary: '처리 중',
            detail: `${selectedSyncCorp.value} 코나카드를 갱신하고 있습니다. 잠시만 기다려주세요...`,
            life: 5000
        });

        const response = await KrewsService.syncCorpKonacards(selectedSyncCorp.value);

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: response.data.message || `${selectedSyncCorp.value} 코나카드가 갱신되었습니다.`,
            life: 3000
        });

        syncKonacardCorpDialogVisible.value = false;

        console.log('⏳ Rate limit 회피: 2초 대기...');
        await sleep(2000);

        await loadKrews(true);
    } catch (error) {
        console.error('Konacard sync error:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: `${selectedSyncCorp.value} 코나카드 갱신에 실패했습니다.`,
            life: 3000
        });
    } finally {
        syncing.value = false;
    }
}

// ========================================
// 필터 초기화
// ========================================
function clearFilters() {
    selectedCorp.value = null;
    selectedStatus.value = null;
    filters.value.global.value = null;
}

// ========================================
// CSV Export
// ========================================
function exportCSV() {
    dt.value.exportCSV();
}

// ========================================
// 법인별 색상
// ========================================
function getCorpColor(corp) {
    const colors = {
        그립컴퍼니: 'success',
        디케이테크인: 'danger',
        링키지랩: 'warning',
        볼트업: 'primary',
        서울아레나: 'info',
        야나두: 'info',
        에이엑스지: 'success',
        엑스엘게임즈: 'secondary',
        카카오: 'warning',
        카카오게임즈: 'success',
        카카오모빌리티: 'primary',
        카카오뱅크: 'warn',
        카카오스타일: 'secondary',
        카카오엔터테인먼트: 'danger',
        카카오엔터프라이즈: 'info',
        카카오임팩트: 'success',
        카카오페이: 'warning',
        카카오페이증권: 'primary',
        카카오헬스케어: 'info',
        카카오VX: 'info',
        케이드라이브: 'warning',
        케이앤웍스: 'primary',
        케이엠파크: 'info',
        키이스트: 'info',
        SM엔터테인먼트: 'secondary'
    };
    return colors[corp] || 'secondary';
}

onMounted(async () => {
    await loadKrews(false);
});
</script>

<template>
    <div class="relative">
        <!-- ✅ 갱신 중 OR 로딩 중 오버레이 (통합!) -->
        <div v-if="syncing || loading" class="sync-overlay">
            <div class="sync-message-box">
                <i class="pi pi-spin pi-spinner" style="font-size: 3rem; color: var(--primary-color)"></i>
                <p class="sync-message-title">
                    {{ syncing ? '조합원 정보를 갱신하는 중...' : '조합원 목록을 불러오는 중...' }}
                </p>
                <p class="sync-message-subtitle">
                    {{ syncing ? '잠시만 기다려주세요. 다른 작업을 진행할 수 없습니다.' : '잠시만 기다려주세요.' }}
                </p>
            </div>
        </div>

        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="전체조합원갱신" icon="pi pi-refresh" severity="success" raised class="mr-2" :disabled="syncing || loading" :loading="syncing" @click="syncAllKrews" />
                    <Button label="법인별조합원갱신" icon="pi pi-building" severity="info" raised class="mr-2" :disabled="syncing || loading" @click="openSyncCorpDialog" />
                    <Button label="법인별코나카드갱신" icon="pi pi-id-card" severity="warn" raised :disabled="syncing || loading" @click="openSyncKonacardCorpDialog" />
                </template>

                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="help" raised :disabled="syncing || loading" @click="exportCSV" />
                </template>
            </Toolbar>

            <div class="mb-6">
                <div class="flex items-center gap-3 mb-4" style="align-items: center">
                    <div class="font-semibold text-xl" style="line-height: 1; margin: 0">Filtering</div>

                    <Button label="Refresh" icon="pi pi-refresh" text severity="success" size="small" :loading="loading" :disabled="syncing || loading" @click="refreshKrews" />

                    <Button label="Clear" icon="pi pi-filter-slash" text severity="secondary" size="small" :disabled="syncing || loading" @click="clearFilters" />
                </div>

                <!-- 필터 입력 필드들 -->
                <div class="grid grid-cols-12 gap-4">
                    <!-- 법인 필터 -->
                    <div class="col-span-12 md:col-span-4 lg:col-span-3">
                        <label for="corp-filter" class="block text-sm font-medium mb-2">법인</label>
                        <Select id="corp-filter" v-model="selectedCorp" :options="corpList" placeholder="전체" showClear class="w-full" :style="{ height: '40px' }" :disabled="syncing || loading">
                            <template #value="slotProps">
                                <div class="flex items-center" style="height: 100%">
                                    <Tag v-if="slotProps.value" :value="slotProps.value" :severity="getCorpColor(slotProps.value)" />
                                    <span v-else>전체</span>
                                </div>
                            </template>
                            <template #option="slotProps">
                                <Tag :value="slotProps.option" :severity="getCorpColor(slotProps.option)" />
                            </template>
                        </Select>
                    </div>

                    <!-- CMS 상태 필터 -->
                    <div class="col-span-12 md:col-span-4 lg:col-span-3">
                        <label for="status-filter" class="block text-sm font-medium mb-2">CMS 상태</label>
                        <Select id="status-filter" v-model="selectedStatus" :options="statusList" optionLabel="label" optionValue="value" placeholder="전체" showClear class="w-full" :style="{ height: '40px' }" :disabled="syncing || loading">
                            <template #value="slotProps">
                                <div class="flex items-center" style="height: 100%">
                                    <Tag v-if="slotProps.value" :value="slotProps.value" :severity="slotProps.value === '등록성공' ? 'success' : 'warn'" />
                                    <span v-else>전체</span>
                                </div>
                            </template>
                            <template #option="slotProps">
                                <Tag :value="slotProps.option.label" :severity="slotProps.option.value === '등록성공' ? 'success' : 'warn'" />
                            </template>
                        </Select>
                    </div>

                    <!-- 키워드 검색 -->
                    <div class="col-span-12 md:col-span-4 lg:col-span-6">
                        <label for="keyword-search" class="block text-sm font-medium mb-2">Keyword Search</label>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText id="keyword-search" v-model="filters['global'].value" placeholder="이름, LDAP, 법인, 조직도 검색..." class="w-full" :style="{ height: '40px' }" :disabled="syncing || loading" />
                        </IconField>
                    </div>
                </div>

                <!-- 필터 적용 상태 표시 -->
                <div v-if="selectedCorp || selectedStatus || filters['global'].value" class="flex gap-2 mt-4">
                    <Chip v-if="selectedCorp" :label="`법인: ${selectedCorp}`" icon="pi pi-building" removable @remove="selectedCorp = null" />
                    <Chip v-if="selectedStatus" :label="`상태: ${selectedStatus}`" icon="pi pi-check-circle" removable @remove="selectedStatus = null" />
                    <Chip v-if="filters['global'].value" :label="`검색: ${filters['global'].value}`" icon="pi pi-search" removable @remove="filters['global'].value = null" />
                </div>
            </div>

            <DataTable
                ref="dt"
                :value="filteredKrews"
                dataKey="krewunionId"
                :paginator="true"
                :rows="10"
                :filters="filters"
                :globalFilterFields="['krewunionId', 'name', 'ldap', 'corp', 'phoneNumber', 'konacard', 'status', 'orgChartString']"
                :rowHover="true"
                :loading="false"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} krews"
                showGridlines
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <div class="flex items-center gap-3" style="align-items: center">
                            <h4 style="margin: 0; padding: 0; line-height: 1">조합원 관리</h4>
                            <Button label="선택 해제" icon="pi pi-times" text severity="secondary" size="small" :disabled="syncing || loading" @click="deselectAll" />
                        </div>
                    </div>
                </template>

                <template #empty>
                    <div class="text-center p-4">조합원 데이터가 없습니다.</div>
                </template>

                <Column :exportable="false" style="width: 3rem">
                    <template #header>
                        <div class="flex justify-center">
                            <Checkbox :modelValue="isAllCurrentPageSelected" @update:modelValue="toggleCurrentPageSelection" :binary="true" :disabled="syncing || loading" />
                        </div>
                    </template>
                    <template #body="slotProps">
                        <div class="flex justify-center">
                            <Checkbox :modelValue="isRowSelected(slotProps.data)" @update:modelValue="toggleRowSelection(slotProps.data)" :binary="true" :disabled="syncing || loading" />
                        </div>
                    </template>
                </Column>
                <Column field="krewunionId" header="조합원 ID" sortable style="min-width: 10rem"></Column>
                <Column field="name" header="이름" sortable style="min-width: 12rem"></Column>
                <Column field="ldap" header="LDAP" sortable style="min-width: 12rem"></Column>
                <Column field="corp" header="법인" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.corp" :severity="getCorpColor(slotProps.data.corp)" />
                    </template>
                </Column>
                <Column field="phoneNumber" header="연락처" sortable style="min-width: 12rem"></Column>
                <Column field="konacard" header="코나카드" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <span v-if="slotProps.data.konacard">{{ slotProps.data.konacard }}</span>
                        <Tag v-else value="미등록" severity="secondary" />
                    </template>
                </Column>
                <Column field="status" header="CMS 상태" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.status" :severity="slotProps.data.status === '등록성공' ? 'success' : 'warn'" />
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 8rem">
                    <template #body="slotProps">
                        <div class="flex justify-center">
                            <Button icon="pi pi-eye" rounded raised severity="info" :disabled="syncing || loading" @click="viewKrew(slotProps.data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- 법인별 조합원 갱신 Dialog -->
        <Dialog v-model:visible="syncCorpDialogVisible" :style="{ width: '450px' }" header="법인별 조합원 갱신" :modal="true" :closable="!syncing">
            <div class="flex flex-col gap-4">
                <label for="sync-corp" class="font-bold">법인 선택</label>
                <Select id="sync-corp" v-model="selectedSyncCorp" :options="corpList" placeholder="법인을 선택하세요" class="w-full" :disabled="syncing">
                    <template #value="slotProps">
                        <Tag v-if="slotProps.value" :value="slotProps.value" :severity="getCorpColor(slotProps.value)" />
                        <span v-else>법인을 선택하세요</span>
                    </template>
                    <template #option="slotProps">
                        <Tag :value="slotProps.option" :severity="getCorpColor(slotProps.option)" />
                    </template>
                </Select>
            </div>

            <template #footer>
                <Button label="취소" icon="pi pi-times" outlined severity="secondary" :disabled="syncing" @click="syncCorpDialogVisible = false" />
                <Button label="갱신" icon="pi pi-check" raised severity="success" :loading="syncing" :disabled="syncing" @click="syncCorpKrews" />
            </template>
        </Dialog>

        <!-- 법인별 코나카드 갱신 Dialog -->
        <Dialog v-model:visible="syncKonacardCorpDialogVisible" :style="{ width: '450px' }" header="법인별 코나카드 갱신" :modal="true" :closable="!syncing">
            <div class="flex flex-col gap-4">
                <label for="sync-konacard-corp" class="font-bold">법인 선택</label>
                <Select id="sync-konacard-corp" v-model="selectedSyncCorp" :options="corpList" placeholder="법인을 선택하세요" class="w-full" :disabled="syncing">
                    <template #value="slotProps">
                        <Tag v-if="slotProps.value" :value="slotProps.value" :severity="getCorpColor(slotProps.value)" />
                        <span v-else>법인을 선택하세요</span>
                    </template>
                    <template #option="slotProps">
                        <Tag :value="slotProps.option" :severity="getCorpColor(slotProps.option)" />
                    </template>
                </Select>
            </div>

            <template #footer>
                <Button label="취소" icon="pi pi-times" outlined severity="secondary" :disabled="syncing" @click="syncKonacardCorpDialogVisible = false" />
                <Button label="갱신" icon="pi pi-check" raised severity="warn" :loading="syncing" :disabled="syncing" @click="syncCorpKonacards" />
            </template>
        </Dialog>

        <!-- ✅ 조합원 상세 정보 컴포넌트 -->
        <KrewDetail :krew="selectedKrew" :visible="krewDialog" @close="krewDialog = false" />
    </div>
</template>

<style scoped>
/* ====================================== */
/* 1. 기본 카드 & 레이아웃 스타일 */
/* ====================================== */

:deep(.card) {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

:deep(.card:hover) {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* ====================================== */
/* 2. Toolbar 스타일 */
/* ====================================== */

:deep(.p-toolbar) {
    background: linear-gradient(135deg, var(--surface-ground) 0%, var(--surface-50) 100%);
    border-radius: var(--content-border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* ====================================== */
/* 3. DataTable 스타일 */
/* ====================================== */

:deep(.p-datatable-header) {
    background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
    border-radius: var(--content-border-radius) var(--content-border-radius) 0 0;
    padding: 1.5rem;
}

:deep(.p-datatable-thead > tr > th) {
    background: var(--surface-100);
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--text-color);
}

:deep(.p-datatable-tbody > tr:hover) {
    background: var(--highlight-bg) !important;
    transition: all 0.2s ease;
}

/* ====================================== */
/* 4. 폼 입력 요소 스타일 */
/* ====================================== */

:deep(.p-select),
:deep(.p-inputtext) {
    transition: all 0.3s ease;
}

:deep(.p-select:focus),
:deep(.p-inputtext:focus) {
    box-shadow: 0 0 0 0.2rem var(--primary-color) !important;
    transform: translateY(-1px);
}

:deep(.p-select) {
    display: flex;
    align-items: center;
}

:deep(.p-select .p-select-label) {
    display: flex;
    align-items: center;
    height: 100%;
}

/* ====================================== */
/* 5. 버튼 스타일 */
/* ====================================== */

:deep(.p-button:not(:disabled):hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

:deep(.p-button:not(:disabled):active) {
    transform: translateY(0);
}

:deep(.p-button:disabled) {
    opacity: 0.65 !important;
}

/* ====================================== */
/* 6. Tag & Chip 스타일 */
/* ====================================== */

:deep(.p-tag) {
    font-weight: 600;
    padding: 0.5rem 0.75rem;
    border-radius: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.p-chip) {
    background: var(--primary-50);
    color: var(--primary-color);
    padding: 0.5rem 0.75rem;
    border-radius: 1rem;
    font-weight: 600;
}

:deep(.p-chip-remove-icon) {
    margin-left: 0.5rem;
    cursor: pointer;
}

:deep(.p-chip-remove-icon:hover) {
    color: var(--primary-600);
}

/* ====================================== */
/* 7. Disabled 요소 공통 스타일 */
/* ====================================== */

:deep(.p-disabled),
:deep(.p-component:disabled) {
    opacity: 0.7 !important;
}

:deep(.p-inputtext:disabled),
:deep(.p-select:disabled) {
    opacity: 0.75 !important;
    background-color: var(--surface-100) !important;
}

/* ====================================== */
/* 8. Dialog 공통 스타일 */
/* ====================================== */

:deep(.p-dialog) {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

:deep(.p-dialog-header) {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-600) 100%);
    color: var(--primary-contrast-color);
    border-radius: var(--content-border-radius) var(--content-border-radius) 0 0;
}

:deep(.p-dialog-content) {
    padding: 2rem;
}

/* ====================================== */
/* 9. 갱신 중 오버레이 */
/* ====================================== */

.sync-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(2px);
}

.sync-message-box {
    background: white;
    padding: 3rem 4rem;
    border-radius: 1rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    text-align: center;
    max-width: 500px;
    animation: fadeInScale 0.3s ease-out;
}

.sync-message-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 1.5rem 0 0.5rem 0;
}

.sync-message-subtitle {
    font-size: 1rem;
    color: var(--text-color-secondary);
    margin: 0;
}

@keyframes fadeInScale {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* ====================================== */
/* 10. 반응형 */
/* ====================================== */

@media (max-width: 768px) {
}
</style>

<!-- ✅ 다크모드 전용 (노란 배경만 별도 처리) -->
<style>
.app-dark .sync-message-box {
    background: var(--surface-card);
}
</style>
