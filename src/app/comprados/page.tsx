'use client';

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Client, Databases, Query, Storage } from "appwrite";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Product {
    $id: string;
    title: string;
    productURL: string;
    imageId: string;
    priority: 'Alta' | 'no tanta' | 'poquillo';
    comprado?: boolean;
}

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);
const storage = new Storage(client);

const CompradosPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const router = useRouter();

    useEffect(() => {
        fetchProducts();
    }, []);
    
    const fetchProducts = async () => {
        try {
            const response = await databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
                [
                    Query.equal('comprado', true)
                ],
            );

            setProducts(response.documents.map(doc => ({
                $id: doc.$id,
                title: doc.title as string,
                productURL: doc.link as string,
                imageId: doc.imageId as string,
                priority: doc.priority as 'Alta' | 'no tanta' | 'poquillo',
                comprado: doc.comprado as boolean,
            })));
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleCompradoChange = async (productId: string, newState: boolean) => {
        try {
            await databases.updateDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
                productId,
                {
                    comprado: newState
                }
            );
            await fetchProducts();
        } catch (error) {
            console.error('Error updating product:', error);
        }
    };

    const deleteProduct = async (productId: string, imageId: string) => {
        try {
            await storage.deleteFile(
                process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
                imageId
            );
            
            await databases.deleteDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
                productId
            );
    
            await fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    return (
            <div className='w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 pt-6'>
                <Button onClick={() => router.push('/')}>Ver los que te faltan!!!</Button>
                <div className="max-w-[1200px] mx-auto mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                        {products.map((product) => (
                            <div 
                                key={product.$id} 
                                className="border rounded-lg overflow-hidden shadow-lg bg-white"
                            >
                                <img
                                    src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${product.imageId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
                                    alt={product.title}
                                    className="w-full aspect-square object-cover"
                                />
                                <div className="p-4">
                                    <h3 className="text-lg sm:text-xl font-bold mb-2">{product.title}</h3>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <span className={`px-2 py-1 rounded-full text-sm inline-block ${
                                            product.priority === 'Alta' 
                                                ? 'bg-red-100 text-red-800' 
                                                : product.priority === 'no tanta'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {product.priority}
                                        </span>
                                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                            <a 
                                            href={product.productURL}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
                                        >
                                            Ver Producto
                                        </a>
                                        <div className="flex items-center space-x-2">
                                            <Switch 
                                                checked={product.comprado} 
                                                onCheckedChange={(checked) => handleCompradoChange(product.$id, checked)}
                                            />
                                        </div>
                                        <button
                                            onClick={() => deleteProduct(product.$id, product.imageId)}
                                            className="p-1.5 sm:p-2 text-red-500 hover:text-red-700"
                                        >
                                            <TrashIcon size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
export default CompradosPage;