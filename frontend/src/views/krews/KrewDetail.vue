<script setup>
import { computed } from 'vue';

const props = defineProps({
    krew: {
        type: Object,
        required: true
    },
    visible: {
        type: Boolean,
        required: true
    }
});

const emit = defineEmits(['close']);

const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => {
        if (!value) {
            emit('close');
        }
    }
});

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
</script>

<template>
    <Dialog v-model:visible="dialogVisible" :style="{ width: '700px' }" header="조합원 상세 정보" :modal="true" class="krew-detail-dialog">
        <div class="flex flex-col gap-6">
            <!-- 기본 정보 섹션 -->
            <div class="detail-section">
                <div class="section-header">
                    <i class="pi pi-user"></i>
                    <span>기본 정보</span>
                </div>

                <div class="grid grid-cols-12 gap-8 mb-6">
                    <div class="col-span-6">
                        <label class="detail-label">조합원 ID</label>
                        <div class="detail-value-box">{{ krew.krewunionId || '-' }}</div>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-8 mb-6">
                    <div class="col-span-6">
                        <label class="detail-label">이름</label>
                        <div class="detail-value-highlight name-highlight">{{ krew.name || '-' }}</div>
                    </div>
                    <div class="col-span-6">
                        <label class="detail-label">LDAP</label>
                        <div class="detail-value-highlight name-highlight">{{ krew.ldap || '-' }}</div>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-8">
                    <div class="col-span-6">
                        <label class="detail-label">법인</label>
                        <div class="mt-2">
                            <Tag v-if="krew.corp" :value="krew.corp" :severity="getCorpColor(krew.corp)" class="detail-tag" />
                            <span v-else class="detail-value-empty">미지정</span>
                        </div>
                    </div>
                    <div class="col-span-6">
                        <label class="detail-label">연락처</label>
                        <div class="detail-value-highlight name-highlight">{{ krew.phoneNumber || '-' }}</div>
                    </div>
                </div>
            </div>

            <!-- 조합 정보 섹션 -->
            <div class="detail-section">
                <div class="section-header">
                    <i class="pi pi-check-circle"></i>
                    <span>조합 정보</span>
                </div>

                <div class="grid grid-cols-12 gap-8 mb-6">
                    <div class="col-span-6">
                        <label class="detail-label">체크오프 대상</label>
                        <div class="mt-2">
                            <Tag v-if="krew.isCheckoff" :value="krew.isCheckoff" :severity="krew.isCheckoff === '체크오프 대상' ? 'success' : 'secondary'" class="detail-tag" />
                            <Tag v-else value="정보 없음" severity="secondary" class="detail-tag" />
                        </div>
                    </div>
                    <div class="col-span-6">
                        <label class="detail-label">상태</label>
                        <div class="mt-2">
                            <Tag v-if="krew.status" :value="krew.status" :severity="krew.status === '등록성공' ? 'success' : 'warn'" class="detail-tag" />
                            <span v-else class="detail-value-empty">미등록</span>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-8">
                    <div class="col-span-6">
                        <label class="detail-label">가입월</label>
                        <div class="detail-value-highlight name-highlight">{{ krew.joinMonth || '-' }}</div>
                    </div>
                    <div class="col-span-6">
                        <label class="detail-label">조합원방 참여여부</label>
                        <div class="mt-2">
                            <Tag v-if="krew.chatRoomJoined" :value="krew.chatRoomJoined" :severity="krew.chatRoomJoined === 'Y' || krew.chatRoomJoined === '참여' ? 'success' : 'secondary'" class="detail-tag" />
                            <Tag v-else value="정보 없음" severity="secondary" class="detail-tag" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- 코나카드 정보 섹션 -->
            <div class="detail-section">
                <div class="section-header">
                    <i class="pi pi-credit-card"></i>
                    <span>코나카드 정보</span>
                </div>

                <div class="grid grid-cols-12 gap-8">
                    <div class="col-span-6">
                        <label class="detail-label">코나카드</label>
                        <div class="mt-2">
                            <span v-if="krew.konacard" class="detail-value-highlight name-highlight">{{ krew.konacard }}</span>
                            <Tag v-else value="미등록" severity="secondary" class="detail-tag" />
                        </div>
                    </div>
                    <div class="col-span-6">
                        <label class="detail-label">앱등록여부</label>
                        <div class="mt-2">
                            <Tag v-if="krew.konacardAppRegistered" :value="krew.konacardAppRegistered" :severity="krew.konacardAppRegistered === 'Y' || krew.konacardAppRegistered === '등록' ? 'success' : 'secondary'" class="detail-tag" />
                            <Tag v-else value="미등록" severity="secondary" class="detail-tag" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- 조직 정보 섹션 -->
            <div class="detail-section">
                <div class="section-header">
                    <i class="pi pi-sitemap"></i>
                    <span>조직 정보</span>
                </div>

                <div class="grid grid-cols-12 gap-8 mb-6">
                    <div class="col-span-6">
                        <label class="detail-label">직책</label>
                        <div class="detail-value-box">{{ krew.position || '-' }}</div>
                    </div>
                </div>

                <div>
                    <label class="detail-label">조직도</label>
                    <div v-if="krew.orgChart && krew.orgChart.length > 0" class="detail-value-highlight mt-2">
                        {{ krew.orgChart.join(' > ') }}
                    </div>
                    <div v-else class="detail-value-empty mt-2">조직도 정보 없음</div>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="닫기" icon="pi pi-times" outlined severity="secondary" @click="dialogVisible = false" />
        </template>
    </Dialog>
</template>

<style scoped>
/* ====================================== */
/* 조합원 상세 Dialog 스타일 */
/* ====================================== */

.krew-detail-dialog :deep(.p-dialog-content) {
    padding: 1.5rem !important;
    background: var(--surface-ground) !important;
}

.detail-section {
    padding: 2rem 1.5rem;
    background: var(--surface-0);
    border-radius: var(--content-border-radius);
    border-left: 4px solid var(--primary-color);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.section-header {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--surface-border);
}

.section-header i {
    font-size: 1.125rem;
    color: var(--primary-color);
}

.detail-label {
    display: block;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin-bottom: 0.5rem;
}

.detail-value-box {
    font-size: 1rem;
    font-weight: 500;
    color: var(--text-color);
    padding: 0.75rem 1rem;
    background: var(--surface-50);
    border-radius: 6px;
    border: 1px solid var(--surface-border);
    min-height: 2.75rem;
    display: flex;
    align-items: center;
}

.detail-value-highlight {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-color);
    padding: 0.75rem 1rem;
    background: var(--primary-50);
    border-radius: 6px;
    border: 1px solid var(--primary-100);
    min-height: 2.75rem;
    display: flex;
    align-items: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.name-highlight {
    font-size: 1.125rem;
    font-weight: 700;
    background: #fffacd;
    color: #b8860b !important;
    border-color: #ffe87c;
}

.detail-value-empty {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    font-style: italic;
    padding: 0.75rem 1rem;
    background: var(--surface-50);
    border-radius: 6px;
    border: 1px dashed var(--surface-border);
    display: inline-block;
}

.detail-tag {
    font-size: 0.9rem !important;
    padding: 0.5rem 0.875rem !important;
    font-weight: 600 !important;
}

/* ====================================== */
/* 반응형 */
/* ====================================== */

@media (max-width: 768px) {
    .krew-detail-dialog :deep(.p-dialog) {
        width: 95vw !important;
    }

    .detail-section {
        padding: 1.5rem;
    }

    .section-header {
        font-size: 1rem;
    }

    .section-header i {
        font-size: 1rem;
    }

    .detail-value-highlight {
        font-size: 1rem;
        padding: 0.75rem 1rem;
    }

    .name-highlight {
        font-size: 1rem;
    }
}
</style>

<!-- 다크모드 전용 -->
<style>
.app-dark .name-highlight {
    background: #4a4520 !important;
    color: #daa520 !important;
    border-color: #6a6530 !important;
}
</style>
