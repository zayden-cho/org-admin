<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { KrewsService } from '@/service/KrewsService';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';

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

// 필터 상태
const selectedCorp = ref(null);
const selectedStatus = ref(null);

// 법인 목록
const corpList = computed(() => {
    const corps = [...new Set(krews.value.map(k => k.corp))];
    return corps.filter(Boolean).sort();
});

// CMS 상태 목록
const statusList = [
    { label: '등록성공', value: '등록성공' },
    { label: '미등록', value: '미등록' }
];

// 필터링된 데이터
const filteredKrews = computed(() => {
    let result = krews.value;

    if (selectedCorp.value) {
        result = result.filter(k => k.corp === selectedCorp.value);
    }

    if (selectedStatus.value) {
        result = result.filter(k => k.status === selectedStatus.value);
    }

    return result;
});

// 페이지 전환 시 선택 해제
watch(() => dt.value?.d_first, (newFirst, oldFirst) => {
    if (oldFirst !== undefined && newFirst !== oldFirst) {
        selectedKrews.value = [];
    }
});

function getCurrentPageData() {
    if (!dt.value) return [];
    const first = dt.value.d_first || 0;
    const rows = dt.value.d_rows || 10;
    return filteredKrews.value.slice(first, first + rows);
}

const isAllCurrentPageSelected = computed(() => {
    const currentPageData = getCurrentPageData();
    if (currentPageData.length === 0) return false;
    return currentPageData.every(item =>
        selectedKrews.value.some(selected => selected.krewId === item.krewId)
    );
});

function toggleCurrentPageSelection(checked) {
    const currentPageData = getCurrentPageData();

    if (checked) {
        const newSelections = [...selectedKrews.value];
        let addedCount = 0;

        currentPageData.forEach(item => {
            if (!newSelections.some(s => s.krewId === item.krewId)) {
                newSelections.push(item);
                addedCount++;
            }
        });

        selectedKrews.value = newSelections;

        toast.add({
            severity: 'info',
            summary: '선택 완료',
            detail: `현재 페이지 ${addedCount}명이 선택되었습니다.`,
            life: 2000
        });
    } else {
        const currentPageIds = currentPageData.map(item => item.krewId);
        const beforeCount = selectedKrews.value.length;

        selectedKrews.value = selectedKrews.value.filter(
            item => !currentPageIds.includes(item.krewId)
        );

        const removedCount = beforeCount - selectedKrews.value.length;

        toast.add({
            severity: 'info',
            summary: '선택 해제',
            detail: `현재 페이지 ${removedCount}명이 해제되었습니다.`,
            life: 2000
        });
    }
}

function toggleRowSelection(rowData) {
    const index = selectedKrews.value.findIndex(item => item.krewId === rowData.krewId);

    if (index > -1) {
        selectedKrews.value.splice(index, 1);
    } else {
        selectedKrews.value.push(rowData);
    }
}

function isRowSelected(rowData) {
    return selectedKrews.value.some(item => item.krewId === rowData.krewId);
}

onMounted(async () => {
    await loadKrews(false);
});

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
                // 새로고침 버튼 눌렀는데 캐시 사용됨 (이상함)
                toast.add({
                    severity: 'info',
                    summary: '캐시 데이터',
                    detail: '캐시된 데이터를 사용했습니다.',
                    life: 2000
                });
            }
        } else {
            console.log('새로 가져옴');

            toast.add({
                severity: 'success',
                summary: '최신 데이터',
                detail: `${krews.value.length}명의 조합원 정보를 새로 불러왔습니다.`,
                life: 3000
            });
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

function viewKrew(krew) {
    selectedKrew.value = { ...krew };
    krewDialog.value = true;
}

function clearFilters() {
    selectedCorp.value = null;
    selectedStatus.value = null;
    filters.value.global.value = null;
}

function getCorpColor(corp) {
    const colors = {
        '그립컴퍼니': 'success',
        '디케이테크인': 'danger',
        '링키지랩': 'warning',
        '볼트업': 'primary',
        '서울아레나': 'info',
        '에이엑스지': 'success',
        '엑스엘게임즈': 'secondary',
        '카카오': 'warning',
        '카카오게임즈': 'success',
        '카카오모빌리티': 'primary',
        '카카오뱅크': 'warn',
        '카카오스타일': 'secondary',
        '카카오엔터테인먼트': 'danger',
        '카카오엔터프라이즈': 'info',
        '카카오임팩트': 'success',
        '카카오페이': 'warning',
        '카카오페이증권': 'primary',
        '카카오헬스케어': 'info',
        '카카오VX': 'info',
        '케이드라이브': 'warning',
        '케이앤웍스': 'primary',
        '케이엠파크': 'info',
        '키이스트': 'info',
        'SM엔터테인먼트': 'secondary',
    };
    return colors[corp] || 'secondary';
}

function deselectAll() {
    const count = selectedKrews.value.length;
    selectedKrews.value = [];

    toast.add({
        severity: 'info',
        summary: '선택 해제',
        detail: `${count}명의 선택이 해제되었습니다.`,
        life: 2000
    });
}
</script>

<template>
    <div>
        <div class="card">
            <!-- Filtering Section -->
            <div class="mb-6">
                <div class="flex items-center gap-3 mb-4" style="align-items: center;">
                    <div class="font-semibold text-xl" style="line-height: 1; margin: 0;">Filtering</div>

                    <!-- ✅ 추가: Refresh 버튼 -->
                    <Button
                        label="Refresh"
                        icon="pi pi-refresh"
                        text
                        severity="success"
                        size="small"
                        :loading="loading"
                        @click="refreshKrews"
                    />

                    <Button
                        label="Clear"
                        icon="pi pi-filter-slash"
                        text
                        severity="secondary"
                        size="small"
                        @click="clearFilters"
                    />
                </div>

                <!-- 필터 입력 필드들 (기존과 동일) -->
                <div class="grid grid-cols-12 gap-4">
                    <!-- 법인 필터 -->
                    <div class="col-span-12 md:col-span-4 lg:col-span-3">
                        <label for="corp-filter" class="block text-sm font-medium mb-2">법인</label>
                        <Select
                            id="corp-filter"
                            v-model="selectedCorp"
                            :options="corpList"
                            placeholder="전체"
                            showClear
                            class="w-full"
                            :style="{ height: '40px' }"
                        >
                            <template #value="slotProps">
                                <div class="flex items-center" style="height: 100%;">
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
                        <Select
                            id="status-filter"
                            v-model="selectedStatus"
                            :options="statusList"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="전체"
                            showClear
                            class="w-full"
                            :style="{ height: '40px' }"
                        >
                            <template #value="slotProps">
                                <div class="flex items-center" style="height: 100%;">
                                    <Tag
                                        v-if="slotProps.value"
                                        :value="slotProps.value"
                                        :severity="slotProps.value === '등록성공' ? 'success' : 'warn'"
                                    />
                                    <span v-else>전체</span>
                                </div>
                            </template>
                            <template #option="slotProps">
                                <Tag
                                    :value="slotProps.option.label"
                                    :severity="slotProps.option.value === '등록성공' ? 'success' : 'warn'"
                                />
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
                            <InputText
                                id="keyword-search"
                                v-model="filters['global'].value"
                                placeholder="이름, LDAP, 법인 검색..."
                                class="w-full"
                                :style="{ height: '40px' }"
                            />
                        </IconField>
                    </div>
                </div>

                <!-- 필터 적용 상태 표시 -->
                <div v-if="selectedCorp || selectedStatus || filters['global'].value" class="flex gap-2 mt-4">
                    <Chip
                        v-if="selectedCorp"
                        :label="`법인: ${selectedCorp}`"
                        icon="pi pi-building"
                        removable
                        @remove="selectedCorp = null"
                    />
                    <Chip
                        v-if="selectedStatus"
                        :label="`상태: ${selectedStatus}`"
                        icon="pi pi-check-circle"
                        removable
                        @remove="selectedStatus = null"
                    />
                    <Chip
                        v-if="filters['global'].value"
                        :label="`검색: ${filters['global'].value}`"
                        icon="pi pi-search"
                        removable
                        @remove="filters['global'].value = null"
                    />
                </div>
            </div>

            <!-- ✅ DataTable에 loading 상태 추가 -->
            <DataTable
                ref="dt"
                :value="filteredKrews"
                dataKey="krewId"
                :paginator="true"
                :rows="10"
                :filters="filters"
                :rowHover="true"
                :loading="loading"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} krews"
                showGridlines
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <div class="flex items-center gap-3" style="align-items: center;">
                            <h4 style="margin: 0; padding: 0; line-height: 1;">조합원 관리</h4>
                            <Button
                                label="선택 해제"
                                icon="pi pi-times"
                                text
                                severity="secondary"
                                size="small"
                                @click="deselectAll"
                            />
                        </div>
                    </div>
                </template>

                <!-- 나머지 DataTable 코드 동일 -->
                <template #empty>
                    <div class="text-center p-4">
                        조합원 데이터가 없습니다.
                    </div>
                </template>

                <template #loading>
                    <div class="text-center p-4">
                        조합원 목록을 불러오는 중...
                    </div>
                </template>

                <Column :exportable="false" style="width: 3rem">
                    <template #header>
                        <div class="flex justify-center">
                            <Checkbox
                                :modelValue="isAllCurrentPageSelected"
                                @update:modelValue="toggleCurrentPageSelection"
                                :binary="true"
                            />
                        </div>
                    </template>
                    <template #body="slotProps">
                        <div class="flex justify-center">
                            <Checkbox
                                :modelValue="isRowSelected(slotProps.data)"
                                @update:modelValue="toggleRowSelection(slotProps.data)"
                                :binary="true"
                            />
                        </div>
                    </template>
                </Column>
                <Column field="krewId" header="조합원 ID" sortable style="min-width: 10rem"></Column>
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
                        <Tag
                            :value="slotProps.data.status"
                            :severity="slotProps.data.status === '등록성공' ? 'success' : 'warn'"
                        />
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 8rem">
                    <template #body="slotProps">
                        <div class="flex justify-center">
                            <Button
                                icon="pi pi-eye"
                                rounded
                                raised
                                severity="info"
                                @click="viewKrew(slotProps.data)"
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Dialog 동일 -->
        <Dialog
            v-model:visible="krewDialog"
            :style="{ width: '600px' }"
            header="조합원 상세 정보"
            :modal="true"
        >
            <div class="flex flex-col gap-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block font-bold mb-2">조합원 ID</label>
                        <p>{{ selectedKrew.krewId }}</p>
                    </div>
                    <div>
                        <label class="block font-bold mb-2">법인 ID</label>
                        <p>{{ selectedKrew.corpId }}</p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block font-bold mb-2">이름</label>
                        <p>{{ selectedKrew.name }}</p>
                    </div>
                    <div>
                        <label class="block font-bold mb-2">LDAP</label>
                        <p>{{ selectedKrew.ldap }}</p>
                    </div>
                </div>

                <div>
                    <label class="block font-bold mb-2">법인</label>
                    <Tag :value="selectedKrew.corp" :severity="getCorpColor(selectedKrew.corp)" />
                </div>

                <div>
                    <label class="block font-bold mb-2">연락처</label>
                    <p>{{ selectedKrew.phoneNumber }}</p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block font-bold mb-2">체크오프 대상</label>
                        <p>{{ selectedKrew.isCheckoff }}</p>
                    </div>
                    <div>
                        <label class="block font-bold mb-2">CMS 상태</label>
                        <Tag
                            :value="selectedKrew.status"
                            :severity="selectedKrew.status === '등록성공' ? 'success' : 'warn'"
                        />
                    </div>
                </div>

                <div>
                    <label class="block font-bold mb-2">코나카드</label>
                    <p v-if="selectedKrew.konacard">{{ selectedKrew.konacard }}</p>
                    <Tag v-else value="미등록" severity="secondary" />
                </div>

                <div>
                    <label class="block font-bold mb-2">조직도</label>
                    <div v-if="selectedKrew.orgChart && selectedKrew.orgChart.length > 0" class="flex flex-wrap gap-2">
                        <Tag
                            v-for="(org, index) in selectedKrew.orgChart"
                            :key="index"
                            :value="org"
                            severity="secondary"
                        />
                    </div>
                    <p v-else class="text-gray-500">조직도 정보 없음</p>
                </div>
            </div>

            <template #footer>
                <Button
                    label="닫기"
                    icon="pi pi-times"
                    outlined
                    severity="secondary"
                    @click="krewDialog = false"
                />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
/* ========================================
   Card 스타일 개선
   ======================================== */
:deep(.card) {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

:deep(.card:hover) {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* ========================================
   Toolbar 스타일 개선
   ======================================== */
:deep(.p-toolbar) {
    background: linear-gradient(135deg, var(--surface-ground) 0%, var(--surface-50) 100%);
    border-radius: var(--content-border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* ========================================
   DataTable 헤더 스타일
   ======================================== */
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

/* ========================================
   DataTable 행 hover 효과
   ======================================== */
:deep(.p-datatable-tbody > tr:hover) {
    background: var(--highlight-bg) !important;
    transition: all 0.2s ease;
}

/* ========================================
   Filtering 섹션 스타일
   ======================================== */
:deep(.p-select),
:deep(.p-inputtext) {
    transition: all 0.3s ease;
}

:deep(.p-select:focus),
:deep(.p-inputtext:focus) {
    box-shadow: 0 0 0 0.2rem var(--primary-color) !important;
    transform: translateY(-1px);
}

/* ========================================
   Button hover 효과 강화
   ======================================== */
:deep(.p-button:not(:disabled):hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

:deep(.p-button:not(:disabled):active) {
    transform: translateY(0);
}

/* ========================================
   Tag 스타일 개선
   ======================================== */
:deep(.p-tag) {
    font-weight: 600;
    padding: 0.5rem 0.75rem;
    border-radius: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* ========================================
   Chip 스타일 개선
   ======================================== */
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

/* ========================================
   Select 높이 통일
   ======================================== */
:deep(.p-select) {
    display: flex;
    align-items: center;
}

:deep(.p-select .p-select-label) {
    display: flex;
    align-items: center;
    height: 100%;
}

/* ========================================
   Dialog 스타일
   ======================================== */
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
</style>
