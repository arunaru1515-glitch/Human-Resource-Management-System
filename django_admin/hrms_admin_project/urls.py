from django.contrib import admin
from django.urls import path
from django.shortcuts import redirect

admin.site.site_header = "HRMS Administration"
admin.site.site_title = "HRMS Admin Portal"
admin.site.index_title = "Human Resource Management System Dashboard"

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', lambda request: redirect('admin/')),
]
