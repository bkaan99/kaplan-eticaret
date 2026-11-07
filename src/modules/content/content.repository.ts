import { and, asc, desc, eq, gte, isNull, lte, ne, or } from "drizzle-orm";
import {
  banner,
  menu,
  menuItem,
  page,
  redirect,
  newId,
  runBatch,
  type Db,
} from "@/db";
import type { BannerInput, MenuKey, PageInput } from "./content.schema";

export interface BannerView {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
}

export interface PageView {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: Date;
}

export interface MenuItemView {
  label: string;
  url: string;
}

export interface ContentRepository {
  listBanners(): Promise<BannerView[]>;
  listActiveBanners(now: Date): Promise<BannerView[]>;
  createBanner(input: BannerInput): Promise<string>;
  updateBanner(id: string, input: BannerInput): Promise<void>;
  deleteBanner(id: string): Promise<void>;

  listPages(): Promise<PageView[]>;
  findPublishedPage(slug: string): Promise<PageView | null>;
  listPublishedPageSlugs(): Promise<{ slug: string; updatedAt: Date }[]>;
  pageSlugTaken(slug: string, excludeId?: string): Promise<boolean>;
  findPage(id: string): Promise<PageView | null>;
  createPage(input: PageInput, slug: string): Promise<string>;
  updatePage(id: string, input: PageInput, slug: string): Promise<void>;
  deletePage(id: string): Promise<void>;
  addRedirect(fromPath: string, toPath: string): Promise<void>;
  findRedirect(path: string): Promise<string | null>;

  getMenu(key: MenuKey): Promise<MenuItemView[]>;
  replaceMenu(key: MenuKey, items: MenuItemView[]): Promise<void>;
}

export class D1ContentRepository implements ContentRepository {
  constructor(private readonly db: () => Db) {}

  async listBanners(): Promise<BannerView[]> {
    return this.db()
      .select()
      .from(banner)
      .orderBy(asc(banner.sortOrder), desc(banner.createdAt));
  }

  async listActiveBanners(now: Date): Promise<BannerView[]> {
    return this.db()
      .select()
      .from(banner)
      .where(
        and(
          eq(banner.isActive, true),
          or(isNull(banner.startsAt), lte(banner.startsAt, now)),
          or(isNull(banner.endsAt), gte(banner.endsAt, now)),
        ),
      )
      .orderBy(asc(banner.sortOrder), desc(banner.createdAt));
  }

  async createBanner(input: BannerInput): Promise<string> {
    const [created] = await this.db()
      .insert(banner)
      .values(input)
      .returning({ id: banner.id });
    return created!.id;
  }

  async updateBanner(id: string, input: BannerInput): Promise<void> {
    await this.db().update(banner).set(input).where(eq(banner.id, id));
  }

  async deleteBanner(id: string): Promise<void> {
    await this.db().delete(banner).where(eq(banner.id, id));
  }

  async listPages(): Promise<PageView[]> {
    return this.db().select().from(page).orderBy(asc(page.title));
  }

  async findPublishedPage(slug: string): Promise<PageView | null> {
    const [row] = await this.db()
      .select()
      .from(page)
      .where(and(eq(page.slug, slug), eq(page.isPublished, true)))
      .limit(1);
    return row ?? null;
  }

  listPublishedPageSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
    return this.db()
      .select({ slug: page.slug, updatedAt: page.updatedAt })
      .from(page)
      .where(eq(page.isPublished, true));
  }

  async pageSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
    const [found] = await this.db()
      .select({ id: page.id })
      .from(page)
      .where(
        and(
          eq(page.slug, slug),
          excludeId ? ne(page.id, excludeId) : undefined,
        ),
      )
      .limit(1);
    return found !== undefined;
  }

  async findPage(id: string): Promise<PageView | null> {
    const [row] = await this.db()
      .select()
      .from(page)
      .where(eq(page.id, id))
      .limit(1);
    return row ?? null;
  }

  async createPage(input: PageInput, slug: string): Promise<string> {
    const [created] = await this.db()
      .insert(page)
      .values({ ...input, slug })
      .returning({ id: page.id });
    return created!.id;
  }

  async updatePage(id: string, input: PageInput, slug: string): Promise<void> {
    await this.db()
      .update(page)
      .set({ ...input, slug })
      .where(eq(page.id, id));
  }

  async deletePage(id: string): Promise<void> {
    await this.db().delete(page).where(eq(page.id, id));
  }

  async addRedirect(fromPath: string, toPath: string): Promise<void> {
    if (fromPath === toPath) return;
    await this.db()
      .insert(redirect)
      .values({ fromPath, toPath })
      .onConflictDoUpdate({ target: redirect.fromPath, set: { toPath } });
  }

  async findRedirect(path: string): Promise<string | null> {
    const [row] = await this.db()
      .select({ toPath: redirect.toPath })
      .from(redirect)
      .where(eq(redirect.fromPath, path))
      .limit(1);
    return row?.toPath ?? null;
  }

  async getMenu(key: MenuKey): Promise<MenuItemView[]> {
    const found = await this.db().query.menu.findFirst({
      where: eq(menu.key, key),
      with: { items: { orderBy: asc(menuItem.position) } },
    });
    return (
      found?.items.map((item) => ({ label: item.label, url: item.url })) ?? []
    );
  }

  async replaceMenu(key: MenuKey, items: MenuItemView[]): Promise<void> {
    const db = this.db();
    await db.insert(menu).values({ key }).onConflictDoNothing();
    const found = await db.query.menu.findFirst({
      where: eq(menu.key, key),
      columns: { id: true },
    });
    const menuId = found!.id;
    // Silme + ekleme tek batch'te (satır başına ekleme: D1 sorgu başına 100 parametre sınırı).
    await runBatch(db, [
      db.delete(menuItem).where(eq(menuItem.menuId, menuId)),
      ...items.map((item, position) =>
        db.insert(menuItem).values({
          id: newId(),
          menuId,
          label: item.label,
          url: item.url,
          position,
        }),
      ),
    ]);
  }
}
