import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}) {
    return (
        (<div
            className={cn("animate-pulse rounded-lg bg-muted/60", className)}
            {...props} />)
    );
}

function OrderCardSkeleton() {
    return (
        <div className="bg-card border border-border/60 rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-7 w-20 rounded-full" />
            </div>
            <div className="flex gap-4 py-4 border-t border-border/40">
                <Skeleton className="h-16 w-16 rounded-lg" />
                <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-border/40 mt-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-28 rounded-lg" />
            </div>
        </div>
    );
}

function ProductCardSkeleton() {
    return (
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-2/3 mb-4" />
                <Skeleton className="h-5 w-1/2 rounded-md" />
            </div>
        </div>
    );
}

function SellerCardSkeleton() {
    return (
        <div className="bg-card border border-border/40 rounded-xl p-4 flex items-center gap-4 mb-4 shadow-sm">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1">
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
        </div>
    );
}

function ChatItemSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 border-b border-border/40">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-3 w-10" />
        </div>
    );
}

function ProductsGridSkeleton({ count = 8 }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}

function OrdersListSkeleton({ count = 3 }) {
    return (
        <div className="p-4">
            {Array.from({ length: count }).map((_, i) => (
                <OrderCardSkeleton key={i} />
            ))}
        </div>
    );
}

function SellersListSkeleton({ count = 5 }) {
    return (
        <div className="p-4">
            {Array.from({ length: count }).map((_, i) => (
                <SellerCardSkeleton key={i} />
            ))}
        </div>
    );
}

function ChatListSkeleton({ count = 6 }) {
    return (
        <div>
            {Array.from({ length: count }).map((_, i) => (
                <ChatItemSkeleton key={i} />
            ))}
        </div>
    );
}

export { Skeleton, OrderCardSkeleton, ProductCardSkeleton, SellerCardSkeleton, ChatItemSkeleton, ProductsGridSkeleton, OrdersListSkeleton, SellersListSkeleton, ChatListSkeleton }
