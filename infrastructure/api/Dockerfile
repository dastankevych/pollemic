FROM python:3.12-slim

WORKDIR /usr/src/app/api

COPY requirements.txt /usr/src/app/api/requirements.txt

RUN pip install -r /usr/src/app/api/requirements.txt --pre
RUN pip install "python-jose[cryptography]" "passlib[bcrypt]" "python-multipart"

COPY . /usr/src/app/api
