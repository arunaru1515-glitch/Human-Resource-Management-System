from django.contrib import admin
from django.urls import path
from django.shortcuts import redirect

admin.site.site_header = "Enterprise HRMS Administration"
admin.site.site_title = "Enterprise HRMS Admin Portal"
admin.site.index_title = "Enterprise Workforce & Core Operations Control"

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', lambda request: redirect('admin/')),
]
