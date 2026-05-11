# Build stage
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Run stage
FROM nginx:alpine
COPY --from=build /app/dist/gestion-de-prod/browser /usr/share/nginx/html
# If your build output is different, adjust the path above.
# Usually it's dist/[project-name]/browser for Angular 17+
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
