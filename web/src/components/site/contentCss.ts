/* Responsive rules shared by the content pages (About / FAQ / Contact),
   ported from the identical media queries in their .dc.html <style>.
   The header nav collapse (1024px) and the footer 1.4fr grid are already
   handled by globals.css; this covers the hero h1/section shrink and the
   footer gap/padding tweaks. Each page appends its own layout-id rules. */
export const CONTENT_CSS = `
@media (max-width:980px){
  footer > div:first-child{grid-template-columns:1fr 1fr !important;gap:32px !important;}
}
@media (max-width:640px){
  header nav a:not([style*="border-radius: 9999px"]){display:none !important;}
  footer > div:first-child{grid-template-columns:1fr !important;padding:56px 24px 32px !important;}
  footer > div:last-child > div{flex-direction:column;gap:10px;align-items:flex-start !important;}
  h1[style*="font-size: 34px"]{font-size:26px !important;}
  section[style*="height: 220px"]{height:190px !important;}
}
`;
