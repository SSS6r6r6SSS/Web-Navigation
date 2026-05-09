export interface NavLink {
  id: number;
  category_id: number | null;
  title: string;
  url: string;
  description: string;
  icon: string;
  sort_order: number;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  created_at?: string;
  links: NavLink[];
}

export interface SocialLink {
  id: number;
  platform: string;
  url: string;
  icon: string;
  color: string;
  sort_order: number;
}

export interface SiteConfig {
  site_title: string;
  site_subtitle: string;
  site_icon: string;
  bg_image: string;
  bg_overlay: string;
  hitokoto_enabled: string;
  footer_html: string;
  // Theme colors
  color_primary: string;
  color_on_primary: string;
  color_primary_container: string;
  color_on_primary_container: string;
  color_secondary: string;
  color_secondary_container: string;
  color_on_secondary_container: string;
  color_surface: string;
  color_on_surface: string;
  color_on_surface_variant: string;
  color_outline: string;
  color_outline_variant: string;
}

export interface Hitokoto {
  hitokoto: string;
  from?: string;
  from_who?: string;
  type?: string;
}
