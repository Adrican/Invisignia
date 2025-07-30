import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-teal-600">Invisignia</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Iniciar Sesión</Button>
              </Link>
              <Link href="/register">
                <Button>Registrarse</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Protege tus documentos con
            <span className="text-teal-600"> marcas de agua invisibles</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Invisignia utiliza tecnología DCT avanzada para incrustar marcas de
            agua completamente invisibles en tus imágenes, garantizando la
            protección y autenticidad de tus documentos. <b>Sin guardar tus documentos 
            en nuestros servidores.</b>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Comenzar Gratis
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Cómo funciona Invisignia?
            </h2>
            <p className="text-lg text-gray-600">
              Proceso simple y seguro en 3 pasos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-50 to-teal-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">📤</span>
                </div>
                <CardTitle>1. Sube tu imagen</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Selecciona la imagen que quieres proteger y especifica el
                  propósito de la marca de agua (nombre, fecha, información
                  confidencial, etc.)
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-50 to-teal-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <CardTitle>2. Marca invisible</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Nuestro algoritmo DCT incrusta tu información de forma
                  completamente invisible en la imagen, sin alterar su apariencia
                  visual.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-50 to-teal-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <CardTitle>3. Verifica cuando quieras</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  En cualquier momento puedes verificar si una imagen contiene tu
                  marca de agua y recuperar la información original incrustada.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir Invisignia?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-4">👻</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                100% Invisible
              </h3>
              <p className="text-sm text-gray-600">
                Las marcas de agua son completamente invisibles al ojo humano
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="font-semibold text-gray-900 mb-2">Seguro</h3>
              <p className="text-sm text-gray-600">
                Cada marca está vinculada a tu cuenta personal
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="font-semibold text-gray-900 mb-2">Rápido</h3>
              <p className="text-sm text-gray-600">
                Procesamiento instantáneo de tus imágenes
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">Historial</h3>
              <p className="text-sm text-gray-600">
                Mantén un registro de todos tus documentos marcados
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Casos de uso
            </h2>
            <p className="text-lg text-gray-600">
              Perfecto para múltiples necesidades
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📄</span>
                  <span>Documentos oficiales</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Protege contratos, certificados y documentos legales con tu firma
                  invisible.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🎨</span>
                  <span>Propiedad intelectual</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Marca tus diseños, fotografías y obras artísticas para demostrar
                  autoría.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🏢</span>
                  <span>Uso empresarial</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Protege documentos corporativos, presentaciones y material
                  confidencial.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Invisignia</h3>
            <p className="text-gray-400 mb-4">
              Protección avanzada de documentos mediante marcas de agua invisibles
            </p>
            <div className="flex justify-center space-x-6">
              <Link
                href="/login"
                className="text-gray-400 hover:text-white"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="text-gray-400 hover:text-white"
              >
                Registrarse
              </Link>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-400">
              <p>
                &copy; 2025 Invisignia. Sistema de marcas de agua invisibles.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
