<script setup>
import { useToast } from 'primevue/usetoast';

const toast = useToast();

// Props
const props = defineProps({
    items: {
        type: Array,
        default: () => []
    },
    visible: {
        type: Boolean,
        default: false
    }
});

// Emits
const emit = defineEmits(['close']);

// 닫기 핸들러
function handleClose() {
    emit('close');
}

// 복사 함수
function copyItems() {
    const text = props.items.map((item) => `${item.corp}\t${item.name}\t${item.empNo}\t${item.cardNumber}`).join('\n');

    const header = '법인\t이름\t사원번호\t카드번호\n';
    const fullText = header + text;

    navigator.clipboard
        .writeText(fullText)
        .then(() => {
            toast.add({
                severity: 'success',
                summary: '복사 완료',
                detail: `${props.items.length}건의 데이터가 복사되었습니다.`,
                life: 2000
            });
        })
        .catch(() => {
            toast.add({
                severity: 'error',
                summary: '복사 실패',
                detail: '클립보드 복사에 실패했습니다.',
                life: 2000
            });
        });
}

function exportToCSV() {
    try {
        // CSV 헤더
        const header = '법인,이름,사원번호,카드번호\n';

        // CSV 데이터 (쉼표로 구분, 큰따옴표로 감싸기)
        const csv = props.items.map((item) => `"${item.corp}","${item.name}","${item.empNo}","${item.cardNumber}"`).join('\n');

        const fullCSV = header + csv;

        // BOM 추가 (한글 깨짐 방지)
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + fullCSV], { type: 'text/csv;charset=utf-8;' });

        // 파일명 생성 (날짜 포함)
        const date = new Date().toISOString().split('T')[0];
        const filename = `코나카드_미매칭_${date}.csv`;

        // 다운로드
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.add({
            severity: 'success',
            summary: 'Export 완료',
            detail: `${props.items.length}건이 CSV 파일로 다운로드되었습니다.`,
            life: 2000
        });
    } catch (error) {
        console.error('CSV Export 오류:', error);
        toast.add({
            severity: 'error',
            summary: 'Export 실패',
            detail: 'CSV 파일 생성에 실패했습니다.',
            life: 2000
        });
    }
}

// 법인별 색상
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
        카카오: 'contrast',
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
</script>

<template>
    <!-- 코나카드 미매칭 항목 Dialog -->
    <Dialog :visible="visible" :style="{ width: '900px' }" header="조합원명부에 없는 코나카드" :modal="true" @update:visible="handleClose">
        <div class="mb-4">
            <div class="flex items-center gap-3 mb-3">
                <i class="pi pi-exclamation-triangle" style="font-size: 1.5rem; color: var(--yellow-500)"></i>
                <div>
                    <p class="font-bold text-lg m-0">총 {{ items.length }}건</p>
                    <p class="text-sm text-color-secondary m-0">아래 항목들은 조합원명부에서 찾을 수 없어 코나카드를 업데이트하지 못했습니다.</p>
                </div>
            </div>
        </div>

        <DataTable :value="items" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20, 50]" showGridlines stripedRows class="text-sm">
            <Column field="corp" header="법인" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.corp" :severity="getCorpColor(slotProps.data.corp)" />
                </template>
            </Column>
            <Column field="name" header="이름" sortable style="min-width: 8rem"></Column>
            <Column field="empNo" header="사원번호" sortable style="min-width: 10rem"></Column>
            <Column field="cardNumber" header="카드번호" sortable style="min-width: 12rem"></Column>
        </DataTable>

        <template #footer>
            <div class="flex justify-between">
                <div class="flex gap-2">
                    <Button label="복사" icon="pi pi-copy" severity="secondary" outlined @click="copyItems" />
                    <Button label="CSV 다운로드" icon="pi pi-download" severity="success" outlined @click="exportToCSV" />
                </div>
                <Button label="닫기" icon="pi pi-times" severity="secondary" @click="handleClose" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
/* 필요한 경우 스타일 추가 */
</style>
