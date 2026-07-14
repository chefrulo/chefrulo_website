from odoo import http
from odoo.http import request
from odoo.addons.http_routing.models.ir_http import slug
from odoo.addons.website_blog.controllers.main import WebsiteBlog


class ChefruloBlogController(WebsiteBlog):
    """Serve the blog ('The Journal') under /learn instead of /blog.

    Overriding the same method names as WebsiteBlog replaces its route
    registrations entirely, freeing up the old /blog/* paths — which this
    class then re-claims under different method names purely to 301-redirect
    to the /learn equivalent, so there is one canonical URL per page.
    """

    @http.route([
        '/learn',
        '/learn/page/<int:page>',
        '/learn/tag/<string:tag>',
        '/learn/tag/<string:tag>/page/<int:page>',
        '''/learn/<model("blog.blog"):blog>''',
        '''/learn/<model("blog.blog"):blog>/page/<int:page>''',
        '''/learn/<model("blog.blog"):blog>/tag/<string:tag>''',
        '''/learn/<model("blog.blog"):blog>/tag/<string:tag>/page/<int:page>''',
    ], type='http', auth="public", website=True, sitemap=True)
    def blog(self, blog=None, tag=None, page=1, search=None, **opt):
        # WebsiteBlog.blog() redirects to '/blog/<slug>' when there's a single
        # blog and none was specified in the URL — reproduce that shortcut
        # here so it lands on '/learn/<slug>' directly instead of bouncing
        # through the old '/blog/<slug>' path first.
        if not blog:
            from odoo.addons.website.controllers.main import QueryURL
            blogs = request.env['blog.blog'].search(request.website.website_domain())
            if len(blogs) == 1:
                url = QueryURL('/learn/%s' % slug(blogs[0]), search=search, **opt)()
                return request.redirect(url, code=302)
        return super().blog(blog=blog, tag=tag, page=page, search=search, **opt)

    @http.route(['''/learn/<model("blog.blog"):blog>/feed'''], type='http', auth="public", website=True, sitemap=True)
    def blog_feed(self, blog, limit='15', **kwargs):
        return super().blog_feed(blog, limit=limit, **kwargs)

    @http.route([
        '''/learn/<model("blog.blog"):blog>/<model("blog.post", "[('blog_id','=',blog.id)]"):blog_post>''',
    ], type='http', auth="public", website=True, sitemap=True)
    def blog_post(self, blog, blog_post, tag_id=None, page=1, enable_editor=None, **post):
        return super().blog_post(blog, blog_post, tag_id=tag_id, page=page, enable_editor=enable_editor, **post)

    @http.route([
        '/blog',
        '/blog/page/<int:page>',
        '/blog/tag/<string:tag>',
        '/blog/tag/<string:tag>/page/<int:page>',
        '''/blog/<model("blog.blog"):blog>''',
        '''/blog/<model("blog.blog"):blog>/page/<int:page>''',
        '''/blog/<model("blog.blog"):blog>/tag/<string:tag>''',
        '''/blog/<model("blog.blog"):blog>/tag/<string:tag>/page/<int:page>''',
    ], type='http', auth="public", website=True, sitemap=False)
    def blog_redirect_to_learn(self, blog=None, tag=None, page=1, search=None, **opt):
        path = '/learn'
        if blog:
            path += '/' + slug(blog)
        if tag:
            path += '/tag/%s' % tag
        if page and int(page) > 1:
            path += '/page/%s' % page
        return request.redirect(path, code=301)

    @http.route([
        '''/blog/<model("blog.blog"):blog>/<model("blog.post", "[('blog_id','=',blog.id)]"):blog_post>''',
    ], type='http', auth="public", website=True, sitemap=False)
    def blog_post_redirect_to_learn(self, blog, blog_post, **post):
        return request.redirect('/learn/%s/%s' % (slug(blog), slug(blog_post)), code=301)
