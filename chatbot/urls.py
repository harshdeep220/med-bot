from django.urls import path
from . import views

urlpatterns = [
    path('', views.chat_interface, name='chat_interface'),
    path('api/chat/', views.api_chat, name='api_chat'),
]
