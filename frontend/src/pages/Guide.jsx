import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Search, 
  ChevronRight, 
  ChevronDown, 
  BookOpen,
  Rocket,
  Cart,
  Storefront,
  MapPin,
  User,
  Star,
  ArrowLeft,
  Moon,
  Sun,
  Languages,
  CheckCircle,
  Lightbulb,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useThemeStore } from "@/store/themeStore";
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/hooks/useTranslation";
import { guideCategories } from "@/data/guideData";

const Guide = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { language, toggleLanguage } = useLanguageStore();
  const { t } = useTranslation();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const getTitle = (obj) => obj?.[language] || obj?.en || "";

  const filteredCategories = guideCategories.map(category => ({
    ...category,
    articles: category.articles.filter(article => {
      const title = getTitle(article.title).toLowerCase();
      const desc = getTitle(category.description).toLowerCase();
      const query = searchQuery.toLowerCase();
      return title.includes(query) || desc.includes(query);
    })
  })).filter(category => category.articles.length > 0);

  const currentCategory = selectedCategory 
    ? filteredCategories.find(c => c.id === selectedCategory)
    : null;

  const handleArticleClick = (articleId) => {
    setSelectedArticle(articleId);
  };

  const handleBack = () => {
    if (selectedArticle) {
      setSelectedArticle(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    }
  };

  const getIconComponent = (iconName) => {
    const icons = {
      'rocket-outline': Rocket,
      'cart-outline': Cart,
      'storefront-outline': Storefront,
      'map-outline': MapPin,
      'person-outline': User,
      'star-outline': Star,
    };
    return icons[iconName] || BookOpen;
  };

  const renderContent = (content) => {
    return content.map((item, index) => {
      if (item.type === 'text') {
        return (
          <p key={index} className="text-muted-foreground mb-4">
            {item.text}
          </p>
        );
      }
      if (item.type === 'step') {
        return (
          <div key={index} className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
              {index + 1}
            </div>
            <p className="text-foreground pt-0.5">{item.text}</p>
          </div>
        );
      }
      if (item.type === 'tip') {
        return (
          <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 mt-4">
            <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800 dark:text-amber-200 text-sm">{item.text}</p>
          </div>
        );
      }
      return null;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {(selectedCategory || selectedArticle) && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleBack}
                  className="shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold">
                  {selectedArticle 
                    ? getTitle(currentCategory?.articles?.find(a => a.id === selectedArticle)?.title)
                    : selectedCategory
                      ? getTitle(currentCategory?.title)
                      : t('guide.title') || 'Pusat Bantuan'
                  }
                </h1>
                {!selectedCategory && (
                  <p className="text-muted-foreground text-sm">
                    {t('guide.subtitle') || 'Pelajari cara menggunakan semua fitur'}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleLanguage}
                className="hidden sm:flex"
                title={language === 'en' ? 'Switch to Indonesian' : 'Switch to English'}
              >
                <Languages className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          {!selectedArticle && (
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('guide.search') || 'Cari panduan...'}
                className="pl-9 bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container py-6">
        {/* Category List View */}
        {!selectedCategory && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => {
              const IconComponent = getIconComponent(category.icon);
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all text-left group"
                >
                  <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                      {getTitle(category.title)}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {getTitle(category.description)}
                    </p>
                    <p className="text-xs text-primary mt-2">
                      {category.articles.length} {t('guide.articles') || 'artikel'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* Article List View */}
        {selectedCategory && !selectedArticle && (
          <div className="space-y-2">
            {currentCategory?.articles.map((article) => (
              <button
                key={article.id}
                onClick={() => handleArticleClick(article.id)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all text-left"
              >
                <span className="font-medium">{getTitle(article.title)}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        {/* Article Detail View */}
        {selectedArticle && currentCategory && (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-xl border border-border bg-card p-6">
              {renderContent(
                currentCategory.articles.find(a => a.id === selectedArticle)?.content?.[language] ||
                currentCategory.articles.find(a => a.id === selectedArticle)?.content?.en
              )}
            </div>
            
            {/* Related Articles */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3">
                {t('guide.relatedArticles') || 'Artikel Terkait'}
              </h3>
              <div className="space-y-2">
                {currentCategory.articles
                  .filter(a => a.id !== selectedArticle)
                  .slice(0, 3)
                  .map((article) => (
                    <button
                      key={article.id}
                      onClick={() => handleArticleClick(article.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-left"
                    >
                      <span className="text-sm">{getTitle(article.title)}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions FAB (Mobile) */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
              <BookOpen className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] overflow-y-auto">
            <SheetHeader className="mb-4">
              <SheetTitle>{t('guide.quickLinks') || 'Navigasi Cepat'}</SheetTitle>
            </SheetHeader>
            <div className="space-y-2">
              {guideCategories.map((category) => {
                const IconComponent = getIconComponent(category.icon);
                return (
                  <Button
                    key={category.id}
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSelectedArticle(null);
                    }}
                  >
                    <IconComponent className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">{getTitle(category.title)}</div>
                      <div className="text-xs text-muted-foreground">
                        {category.articles.length} {t('guide.articles') || 'artikel'}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default Guide;
