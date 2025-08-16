import { i18n } from '@/i18n';
import { UserRead } from '@/types/schema';

const t = i18n.global.t as any;

type ListAttr<T> = {
  title: string;
  key: string;
  render?: (row: T) => any;
};

// 用于 UserProfile，复用了一部分 user_manager 代码
export function getUserAttrColumns(): ListAttr<UserRead>[] {
  return [
    { title: 'id', key: 'id' },
    { title: '用户名', key: 'username' },
    { title: '邮箱', key: 'email' },
    { title: '昵称', key: 'nickname' },

    {
      title: '最后活动时间',
      key: 'last_active_time',
      render(row) {
        return row.last_active_time ? new Date(row.last_active_time).toLocaleString() : '从未活动';
      },
    },
  ];
}
