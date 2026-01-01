'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Star,
  AlertCircle,
  Package,
  X,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { itemApi, Item, CreateItemInput } from '@/lib/api';
import { clsx } from 'clsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const itemSchema = z.object({
  name: z.string().min(1, '메뉴명을 입력해주세요'),
  description: z.string().optional(),
  category: z.string().min(1, '카테고리를 입력해주세요'),
  price: z.number().min(0, '가격을 입력해주세요'),
  cost: z.number().optional(),
  isAvailable: z.boolean().default(true),
  isPopular: z.boolean().default(false),
});

type ItemFormData = z.infer<typeof itemSchema>;

export default function MenuPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [menuToDelete, setMenuToDelete] = useState<Item | null>(null);

  const { data: itemsData, isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await itemApi.getAll();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateItemInput) => itemApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setShowModal(false);
      setEditingItem(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateItemInput> }) =>
      itemApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setShowModal(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => itemApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setMenuToDelete(null);
    },
  });

  const items = itemsData || [];

  // Get unique categories
  const categories = Array.from(new Set(items.map((item) => item.category)));

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, Item[]>);

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = (item: Item) => {
    setMenuToDelete(item);
  };

  const confirmDelete = () => {
    if (menuToDelete) {
      deleteMutation.mutate(menuToDelete.id);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 pb-24">
      <Header
        title="메뉴 관리"
        rightAction={
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
          >
            <Plus className="w-5 h-5" />
          </Button>
        }
      />

      {/* Search & Filter */}
      <div className="px-4 py-3 bg-white border-b border-secondary-100 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="메뉴 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              !selectedCategory
                ? 'bg-primary-500 text-white'
                : 'bg-secondary-100 text-secondary-600'
            )}
          >
            전체
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                selectedCategory === category
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-100 text-secondary-600'
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-secondary-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="text-center py-12">
            <Package className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-500 mb-4">
              {searchQuery ? '검색 결과가 없어요' : '등록된 메뉴가 없어요'}
            </p>
            <Button
              onClick={() => {
                setEditingItem(null);
                setShowModal(true);
              }}
            >
              메뉴 추가하기
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-secondary-500 mb-2 px-1">
                  {category} ({categoryItems.length})
                </h3>
                <div className="space-y-2">
                  {categoryItems.map((item) => (
                    <MenuItem
                      key={item.id}
                      item={item}
                      onEdit={() => handleEdit(item)}
                      onDelete={() => handleDelete(item)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => {
          setEditingItem(null);
          setShowModal(true);
        }}
        className="fixed right-4 bottom-24 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 active:scale-95 transition-all"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add/Edit Modal */}
      {showModal && (
        <MenuModal
          item={editingItem}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onSubmit={(data) => {
            if (editingItem) {
              updateMutation.mutate({ id: editingItem.id, data });
            } else {
              createMutation.mutate(data as CreateItemInput);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      {menuToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-sm">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900">메뉴 삭제</h3>
              <p className="text-sm text-secondary-500 mt-1">
                "{menuToDelete.name}"을(를) 삭제하시겠습니까?
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setMenuToDelete(null)}
              >
                취소
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={confirmDelete}
                isLoading={deleteMutation.isPending}
              >
                삭제
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  item,
  onEdit,
  onDelete,
}: {
  item: Item;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Card className={clsx('relative', !item.isAvailable && 'opacity-60')}>
      <div className="flex items-center gap-3">
        {/* Image placeholder */}
        <div className="w-16 h-16 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Package className="w-8 h-8 text-secondary-300" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-secondary-900 truncate">{item.name}</h4>
            {item.isPopular && (
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
            )}
            {!item.isAvailable && (
              <span className="px-1.5 py-0.5 text-xs bg-secondary-200 text-secondary-600 rounded">
                품절
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-sm text-secondary-500 truncate">{item.description}</p>
          )}
          <p className="text-sm font-semibold text-primary-500 mt-1">
            {item.price.toLocaleString()}원
          </p>
        </div>

        {/* Actions */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-secondary-100 rounded-lg"
          >
            <MoreVertical className="w-5 h-5 text-secondary-400" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-secondary-100 overflow-hidden z-20">
                <button
                  onClick={() => {
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-secondary-50 w-full text-left"
                >
                  <Edit className="w-4 h-4 text-secondary-500" />
                  <span className="text-sm text-secondary-700">수정</span>
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-secondary-50 w-full text-left"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">삭제</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function MenuModal({
  item,
  onClose,
  onSubmit,
  isLoading,
}: {
  item: Item | null;
  onClose: () => void;
  onSubmit: (data: ItemFormData) => void;
  isLoading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: item
      ? {
          name: item.name,
          description: item.description || '',
          category: item.category,
          price: item.price,
          cost: item.cost || undefined,
          isAvailable: item.isAvailable,
          isPopular: item.isPopular,
        }
      : {
          isAvailable: true,
          isPopular: false,
        },
  });

  const isAvailable = watch('isAvailable');
  const isPopular = watch('isPopular');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative min-h-screen flex items-end sm:items-center justify-center p-4">
        <Card className="relative w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900">
              {item ? '메뉴 수정' : '메뉴 추가'}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-secondary-100 rounded">
              <X className="w-5 h-5 text-secondary-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="메뉴명"
              {...register('name')}
              placeholder="메뉴 이름"
              error={errors.name?.message}
            />

            <Input
              label="카테고리"
              {...register('category')}
              placeholder="예: 메인, 사이드, 음료"
              error={errors.category?.message}
            />

            <Input
              label="가격"
              type="number"
              {...register('price', { valueAsNumber: true })}
              placeholder="0"
              error={errors.price?.message}
            />

            <Input
              label="원가 (선택)"
              type="number"
              {...register('cost', { valueAsNumber: true })}
              placeholder="마진 계산용"
            />

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                설명 (선택)
              </label>
              <textarea
                {...register('description')}
                placeholder="메뉴 설명"
                rows={2}
                className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            {/* Toggle options */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setValue('isAvailable', e.target.checked)}
                  className="w-5 h-5 rounded border-secondary-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">판매 가능</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPopular}
                  onChange={(e) => setValue('isPopular', e.target.checked)}
                  className="w-5 h-5 rounded border-secondary-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">인기 메뉴</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                취소
              </Button>
              <Button type="submit" className="flex-1" isLoading={isLoading}>
                {item ? '수정' : '추가'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
