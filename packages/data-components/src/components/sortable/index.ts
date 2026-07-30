import hyper from "@macrostrat/hyper";
import {
  ReactNode,
  createContext,
  useContext,
  type CSSProperties,
} from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import classNames from "classnames";
import styles from "./sortable.module.sass";

const h = hyper.styled(styles);

export type SortableID = UniqueIdentifier;

export interface SortableItemsProps {
  /** Ordered list of item IDs */
  ids: SortableID[];
  /** Called with the new order after a drag completes */
  onReorder: (ids: SortableID[]) => void;
  /** Render the content of each item. Place a `SortableDragHandle` inside to
   * make part of the item the drag affordance (otherwise the whole item is
   * draggable, which conflicts with buttons/links inside it). */
  renderItem: (id: SortableID, index: number) => ReactNode;
  /** Extra props (e.g. event handlers) spread onto each item element */
  itemProps?: (id: SortableID, index: number) => Record<string, any>;
  className?: string;
  /** Element/component used for the list container (default "ul") */
  component?: any;
}

/** A vertical, keyboard-accessible drag-and-drop sortable list. Reordering is
 * controlled: the current order is `ids`, and `onReorder` receives the new
 * order. */
export function SortableItems({
  ids,
  onReorder,
  renderItem,
  itemProps,
  className,
  component = "ul",
}: SortableItemsProps) {
  const sensors = useSensors(
    // A small movement threshold lets clicks through to item content
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over == null || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

  return h(
    DndContext,
    { sensors, collisionDetection: closestCenter, onDragEnd },
    h(
      SortableContext,
      { items: ids, strategy: verticalListSortingStrategy },
      h(
        component,
        { className: classNames("sortable-list", className) },
        ids.map((id, i) =>
          h(
            SortableItem,
            { key: id, id, itemProps: itemProps?.(id, i) },
            renderItem(id, i),
          ),
        ),
      ),
    ),
  );
}

interface HandleContextValue {
  setRef: (el: HTMLElement | null) => void;
  listeners: Record<string, any> | undefined;
  attributes: Record<string, any>;
}

const HandleContext = createContext<HandleContextValue | null>(null);

function SortableItem({
  id,
  children,
  itemProps,
}: {
  id: SortableID;
  children: ReactNode;
  itemProps?: Record<string, any>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: CSSProperties = {
    transform:
      transform != null
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
        : undefined,
    transition,
  };

  const handleValue: HandleContextValue = {
    setRef: setActivatorNodeRef,
    listeners,
    attributes,
  };

  return h(
    HandleContext.Provider,
    { value: handleValue },
    h(
      "li.sortable-item",
      {
        ...itemProps,
        ref: setNodeRef,
        style,
        className: classNames("sortable-item", itemProps?.className, {
          dragging: isDragging,
        }),
      },
      children,
    ),
  );
}

/** A drag handle for the enclosing `SortableItems` item. Render it inside
 * `renderItem` to control which part of the item initiates a drag. */
export function SortableDragHandle({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const ctx = useContext(HandleContext);
  if (ctx == null) return null;
  return h(
    "button.drag-handle",
    {
      type: "button",
      className,
      ref: ctx.setRef,
      ...ctx.listeners,
      ...ctx.attributes,
      "aria-label": "Drag to reorder",
    },
    children ?? "⠿",
  );
}
