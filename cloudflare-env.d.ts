interface CloudflareEnv {
  ASSETS?: Fetcher;
  IMAGES?: ImagesBinding;
  WORKER_SELF_REFERENCE?: Service;
  NEXTJS_ENV?: string;
  DELIVERABLES_WORKER_URL?: string;
  CLOUDFLARE_ACCOUNT_SUBDOMAIN?: string;
}
