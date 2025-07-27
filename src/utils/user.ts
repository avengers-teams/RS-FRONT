import { i18n } from '@/i18n';
import { chatStatusMap, UserRead } from '@/types/schema';

const t = i18n.global.t as any;

type ListAttr<T> = {
  title: string;
  key: string;
  render?: (row: T) => any;
};

// 用于 UserProfile，复用了一部分 user_manager 代码
export function getUserAttrColumns(): ListAttr<UserRead>[] {
  return [
    { title: '#', key: 'id' },
    { title: t('commons.username'), key: 'username' },
    { title: t('commons.email'), key: 'email' },
    { title: t('commons.nickname'), key: 'nickname' },

    {
      title: t('labels.last_active_time'),
      key: 'last_active_time',
      render(row) {
        return row.last_active_time ? new Date(row.last_active_time).toLocaleString() : t('commons.neverActive');
      },
    },
  ];
}
