import { IconCamera } from '@/components/layout/icons/IconsBiblioteca'
import Input from '@/mk/components/forms/Input/Input'
import Select from '@/mk/components/forms/Select/Select'
import TextArea from '@/mk/components/forms/TextArea/TextArea'
import React from 'react'

const DptoConfig = ({formState,onChange,errors,client_config}:any) => {
  return (
    <>
            <div className="w-full flex justify-center my-6">
              {/* <div className="bg-darkv2 w-[375px] h-[114px] relative rounded-md">
                {(!imageError || preview) && (
                  <img
                    alt="Imagen"
                    className="rounded-lg object-cover max-w-[375px] max-h-[114px] w-full h-full"
                    src={
                      preview ||
                      getUrlImages(
                        "/CLIENT-" +
                          formState?.id +
                          ".png?d=" +
                          new Date().toISOString()
                      )
                    }
                    onError={() => setImageError(true)}
                  />
                )}
                <label
                  htmlFor="imagePerfil"
                  className="absolute right-5 -bottom-3 tablet:-right-3 rounded-full bg-accent text-tBlack p-2 dark:text-tWhite"
                >
                  <IconCamera className="text-tBlack" />
                </label>
                <input
                  type="file"
                  id="imagePerfil"
                  className="hidden"
                  onChange={onChangeFile}
                />
              </div> */}
            </div>
            <Input
              label={"Nombre del condominio"}
              value={formState["name"]}
              type="text"
              name="name"
              error={errors}
              required
              onChange={onChange}
            />
            <Select
              label="Tipo de condominio"
              value={formState?.type}
              name="type"
              error={errors}
              onChange={onChange}
              options={[
                { id: "C", name: "Condominio" },
                { id: "E", name: "Edificio" },
                { id: "U", name: "Urbanización" },
              ]}
              required
            //   icon={<IconArrowDown className="text-lightColor" />}
              className="appearance-none"
            ></Select>
            <Select
              label="Tipo de unidad"
              value={formState?.type_dpto}
              name="type_dpto"
              error={errors}
              onChange={onChange}
              options={[
                { id: "D", name: "Departamento" },
                { id: "O", name: "Oficina" },
                { id: "C", name: "Casa" },
                { id: "L", name: "Lote" },
              ]}
              required
            //   icon={<IconArrowDown className="text-lightColor" />}
              className="appearance-none"
            ></Select>
            <Input
              label={"Dirección"}
              value={formState["address"]}
              type="text"
              name="address"
              error={errors}
              required
              onChange={onChange}
            />
            <Input
              label={"Correo electrónico"}
              value={formState["email"]}
              type="email"
              name="email"
              error={errors}
              required
              onChange={onChange}
            />
            <Input
              label={"Teléfono"}
              value={formState["phone"]}
              type="number"
              name="phone"
              error={errors}
              required
              onChange={onChange}
            />
            <TextArea
              label="Descripción"
              name="description"
              required={false}
              onChange={onChange}
              value={formState?.description}
            />
            <div className="my-5">
              <p className="text-tWhite">
                Fecha de inicio de cobro de expensas
              </p>
              <p className="text-lightv3 text-xs">
                ¿Cuándo quieres que empiece el sistema a cobrar las expensas?
              </p>
              <p className="text-lightv3 text-xs">
                Esta configuración es importante para que el sistema pueda
                calcular correctamente las cuotas adeudadas por los residentes.
              </p>
            </div>
            <Select
              label="Mes"
              value={formState?.month}
              name="month"
              error={errors}
              onChange={onChange}
              options={[
                { id: "1", name: "Enero" },
                { id: "2", name: "Febrero" },
                { id: "3", name: "Marzo" },
                { id: "4", name: "Abril" },
                { id: "5", name: "Mayo" },
                { id: "6", name: "Junio" },
                { id: "7", name: "Julio" },
                { id: "8", name: "Agosto" },
                { id: "9", name: "Septiembre" },
                { id: "10", name: "Octubre" },
                { id: "11", name: "Noviembre" },
                { id: "12", name: "Diciembre" },
              ]}
              required
            //   icon={<IconArrowDown className="text-lightColor" />}
              className="appearance-none"
            ></Select>

            <Input
              type="number"
              label="Año"
              name="year"
              error={errors}
              required
              value={formState?.year}
              onChange={onChange}
            />
            <div className="my-5">
              <p className="text-tWhite">
                Ingresa el monto con el que inicia el condominio
              </p>
              <p className="text-lightv3 text-xs">
                Esta configuración es importante para que el sistema pueda tomar
                en cuenta con qué monto ingresa el condominio.
              </p>
            </div>
            <Input
              type="number"
              label="Saldo"
              name="initial_amount"
              error={errors}
              required
              value={formState?.initial_amount}
              onChange={onChange}
              disabled={
                client_config?.data[0].initial_amount === null ? false : true
              }
            />
          </>
  )
}

export default DptoConfig